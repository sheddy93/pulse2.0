"""
API per firma digitale documenti
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.db.models import Q
import secrets
import hashlib

from users.models import SignatureRequest, DocumentReceipt, SignatureLog, Document, EmployeeProfile
from users.permissions import IsAuthenticatedAndTenantActive


def generate_token():
    return secrets.token_urlsafe(48)


def hash_signature(data):
    """Genera hash della firma"""
    return hashlib.sha256(data.encode()).hexdigest()


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR')


class SignatureRequestView(APIView):
    """Gestione richieste di firma"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Crea richiesta di firma per un documento
        POST /api/signatures/request/
        {
            "document_id": "uuid",
            "signer_employee_id": "uuid",
            "expires_in_days": 7,
            "signature_page": 1,
            "signature_x": 50,
            "signature_y": 100
        }
        """
        document_id = request.data.get('document_id')
        signer_id = request.data.get('signer_employee_id')
        expires_days = request.data.get('expires_in_days', 7)

        try:
            document = Document.objects.get(id=document_id, company=request.user.company)
            signer = EmployeeProfile.objects.get(id=signer_id, company=request.user.company)
        except (Document.DoesNotExist, EmployeeProfile.DoesNotExist):
            return Response({"detail": "Documento o firmatario non trovato"}, status=404)

        # Crea richiesta
        sig_request = SignatureRequest.objects.create(
            document=document,
            signer=signer,
            access_token=generate_token(),
            expires_at=timezone.now() + timezone.timedelta(days=expires_days),
            signature_page=request.data.get('signature_page', 1),
            signature_x=request.data.get('signature_x', 50),
            signature_y=request.data.get('signature_y', 50),
        )

        # Log
        SignatureLog.objects.create(
            signature_request=sig_request,
            action=SignatureLog.ActionChoices.CREATED,
            actor=request.user,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response({
            "id": str(sig_request.id),
            "access_token": sig_request.access_token,
            "sign_url": f"/sign/{sig_request.access_token}/",
            "expires_at": sig_request.expires_at.isoformat(),
        }, status=201)


class SignatureSignView(APIView):
    """Endpoint pubblico per firmare (con token)"""
    permission_classes = [AllowAny]

    def get(self, request, token):
        """Mostra documento da firmare"""
        try:
            sig_request = SignatureRequest.objects.select_related(
                'document', 'signer', 'document__company'
            ).get(access_token=token)
        except SignatureRequest.DoesNotExist:
            return Response({"detail": "Richiesta non trovata"}, status=404)

        if sig_request.status == 'signed':
            return Response({"detail": "Documento già firmato"})

        if sig_request.expires_at < timezone.now():
            sig_request.status = 'expired'
            sig_request.save()
            return Response({"detail": "Richiesta scaduta"}, status=410)

        return Response({
            "document": {
                "id": str(sig_request.document.id),
                "title": sig_request.document.title,
                "description": sig_request.document.description,
            },
            "signer": {
                "name": sig_request.signer.full_name,
            },
            "company": sig_request.document.company.name,
            "status": sig_request.status,
        })

    def post(self, request, token):
        """Firma il documento"""
        try:
            sig_request = SignatureRequest.objects.select_related(
                'document', 'signer'
            ).get(access_token=token)
        except SignatureRequest.DoesNotExist:
            return Response({"detail": "Richiesta non trovata"}, status=404)

        if sig_request.status == 'signed':
            return Response({"detail": "Documento già firmato"})

        if sig_request.expires_at < timezone.now():
            sig_request.status = 'expired'
            sig_request.save()
            return Response({"detail": "Richiesta scaduta"}, status=410)

        # Segna come visionato se primo accesso
        if sig_request.status == 'pending':
            sig_request.status = 'viewed'
            sig_request.viewed_at = timezone.now()
            sig_request.signature_ip = get_client_ip(request)
            sig_request.signature_user_agent = request.META.get('HTTP_USER_AGENT', '')
            SignatureLog.objects.create(
                signature_request=sig_request,
                action=SignatureLog.ActionChoices.VIEWED,
                ip_address=get_client_ip(request),
            )

        # Registra firma
        sig_request.status = 'signed'
        sig_request.signed_at = timezone.now()
        sig_request.signed_by = sig_request.signer.user
        sig_request.signature_hash = hash_signature(str(sig_request.id) + str(timezone.now()))

        SignatureLog.objects.create(
            signature_request=sig_request,
            action=SignatureLog.ActionChoices.SIGNED,
            actor=sig_request.signer.user,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            metadata={"hash": sig_request.signature_hash}
        )

        sig_request.save()

        return Response({
            "status": "signed",
            "signed_at": sig_request.signed_at.isoformat(),
            "signature_hash": sig_request.signature_hash,
        })


class DocumentReceiptView(APIView):
    """Gestione ricevute presa visione"""
    permission_classes = [AllowAny]

    def post(self, request, token):
        """Conferma presa visione"""
        try:
            receipt = DocumentReceipt.objects.select_related(
                'document', 'employee'
            ).get(access_token=token)
        except DocumentReceipt.DoesNotExist:
            return Response({"detail": "Ricevuta non trovata"}, status=404)

        if receipt.status == 'acknowledged':
            return Response({"detail": "Presa visione già confermata"})

        receipt.status = 'acknowledged'
        receipt.acknowledged_at = timezone.now()
        receipt.ip_address = get_client_ip(request)
        receipt.user_agent = request.META.get('HTTP_USER_AGENT', '')

        if request.data.get('note'):
            receipt.user_note = request.data['note']

        SignatureLog.objects.create(
            receipt=receipt,
            action=SignatureLog.ActionChoices.RECEIPT_ACKNOWLEDGED,
            ip_address=get_client_ip(request),
            metadata={"note": receipt.user_note}
        )

        receipt.save()

        return Response({"status": "acknowledged", "at": receipt.acknowledged_at.isoformat()})


class SignatureStatusView(APIView):
    """Stato richieste di firma per azienda"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company

        pending = SignatureRequest.objects.filter(
            document__company=company
        ).exclude(status__in=['signed', 'declined', 'expired']).count()

        signed = SignatureRequest.objects.filter(
            document__company=company,
            status='signed'
        ).count()

        return Response({
            "pending": pending,
            "signed": signed,
            "recent": SignatureRequest.objects.filter(
                document__company=company
            ).order_by('-created_at')[:10].values(
                'id', 'status', 'created_at', 'signed_at',
                'signer__first_name', 'signer__last_name',
                'document__title'
            )
        })