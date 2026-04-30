# -*- coding: utf-8 -*-
"""
API Views per gestione visite mediche, certificati medici e assenze
"""
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    MedicalVisit, MedicalCertificate, OfflineTimeEntry,
    AbsenceType, EmployeeProfile, LeaveRequest, TimeEntry, User
)
from .serializers import (
    MedicalVisitSerializer, MedicalCertificateSerializer,
    OfflineTimeEntrySerializer, AbsenceTypeSerializer,
    MedicalCertificateCreateSerializer
)
from .permissions import IsCompanyAdmin, IsConsultant, IsOwnerOrAdmin


class MedicalVisitViewSet(viewsets.ModelViewSet):
    """ViewSet per gestione visite mediche"""

    serializer_class = MedicalVisitSerializer

    def get_queryset(self):
        user = self.request.user
        company = getattr(user, 'company', None)

        if user.role in ['super_admin', 'platform_owner']:
            return MedicalVisit.objects.all()

        if company:
            return MedicalVisit.objects.filter(company=company)

        if user.role == 'external_consultant':
            # Consulenti vedono solo aziende collegate
            return MedicalVisit.objects.filter(
                company__in=user.consultant_links.values_list('company', flat=True)
            )

        return MedicalVisit.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Segna visita come completata"""
        visit = self.get_object()

        result = request.data.get('result', '')
        next_date = request.data.get('next_visit_date')

        visit.status = MedicalVisit.Status.COMPLETED
        visit.completed_date = timezone.now().date()
        visit.result = result
        if next_date:
            visit.next_visit_date = next_date
        visit.save()

        return Response(MedicalVisitSerializer(visit).data)

    @action(detail=False, methods=['get'])
    def expiring(self, request):
        """Visite che scadono nei prossimi 30 giorni"""
        days = int(request.query_params.get('days', 30))
        expiry_date = timezone.now().date() + timedelta(days=days)

        visits = self.get_queryset().filter(
            status=MedicalVisit.Status.SCHEDULED,
            scheduled_date__lte=expiry_date
        )

        serializer = self.get_serializer(visits, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Visite in ritardo"""
        visits = self.get_queryset().filter(
            status=MedicalVisit.Status.SCHEDULED,
            scheduled_date__lt=timezone.now().date()
        )

        serializer = self.get_serializer(visits, many=True)
        return Response(serializer.data)


class MedicalCertificateViewSet(viewsets.ModelViewSet):
    """ViewSet per gestione certificati medici"""

    def get_serializer_class(self):
        if self.action == 'create':
            return MedicalCertificateCreateSerializer
        return MedicalCertificateSerializer

    def get_queryset(self):
        user = self.request.user
        company = getattr(user, 'company', None)

        if user.role in ['super_admin', 'platform_owner']:
            return MedicalCertificate.objects.all()

        if company:
            return MedicalCertificate.objects.filter(company=company)

        if user.role == 'external_consultant':
            return MedicalCertificate.objects.filter(
                company__in=user.consultant_links.values_list('company', flat=True)
            )

        return MedicalCertificate.objects.none()

    def perform_create(self, serializer):
        certificate = serializer.save(created_by=self.request.user)
        certificate.generate_hash()
        certificate.save()

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        """Valida un certificato"""
        certificate = self.get_object()

        certificate.status = MedicalCertificate.Status.VALIDATED
        certificate.validated_by = request.user
        certificate.validated_at = timezone.now()
        certificate.validation_notes = request.data.get('notes', '')
        certificate.save()

        return Response(MedicalCertificateSerializer(certificate).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Rifiuta un certificato"""
        certificate = self.get_object()

        certificate.status = MedicalCertificate.Status.REJECTED
        certificate.validated_by = request.user
        certificate.validated_at = timezone.now()
        certificate.validation_notes = request.data.get('reason', '')
        certificate.save()

        return Response(MedicalCertificateSerializer(certificate).data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Certificati attivi (in corso)"""
        today = timezone.now().date()
        certificates = self.get_queryset().filter(
            status=MedicalCertificate.Status.VALIDATED,
            start_date__lte=today,
            end_date__gte=today
        )

        serializer = self.get_serializer(certificates, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_employee(self, request):
        """Certificati di un dipendente"""
        employee_id = request.query_params.get('employee_id')

        if not employee_id:
            return Response({'error': 'employee_id required'}, status=400)

        certificates = self.get_queryset().filter(employee_id=employee_id)
        serializer = self.get_serializer(certificates, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expiring(self, request):
        """Certificati che stanno per scadere"""
        days = int(request.query_params.get('days', 7))
        expiry_date = timezone.now().date() + timedelta(days=days)

        certificates = self.get_queryset().filter(
            status=MedicalCertificate.Status.VALIDATED,
            end_date__lte=expiry_date,
            end_date__gte=timezone.now().date()
        )

        serializer = self.get_serializer(certificates, many=True)
        return Response(serializer.data)


class OfflineTimeEntryViewSet(viewsets.ModelViewSet):
    """ViewSet per timbrature offline"""

    serializer_class = OfflineTimeEntrySerializer

    def get_queryset(self):
        return OfflineTimeEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company,
            sync_status=OfflineTimeEntry.SyncStatus.PENDING
        )

    @action(detail=False, methods=['post'])
    def sync(self, request):
        """Sincronizza entries offline - crea TimeEntry reali"""
        user = request.user
        company = getattr(user, 'company', None)

        if not company:
            return Response({'error': 'No company associated'}, status=400)

        pending_entries = OfflineTimeEntry.objects.filter(
            user=user,
            sync_status=OfflineTimeEntry.SyncStatus.PENDING
        )

        synced = []
        failed = []

        for entry in pending_entries:
            try:
                # Crea TimeEntry reale
                time_entry = TimeEntry.objects.create(
                    user=user,
                    company=company,
                    created_by=user,
                    entry_type=entry.entry_type,
                    timestamp=entry.timestamp,
                    source='mobile_offline',
                    latitude=entry.latitude,
                    longitude=entry.longitude,
                    notes=f"Offline sync: {entry.notes}" if entry.notes else ''
                )

                # Aggiorna sync status
                entry.sync_status = OfflineTimeEntry.SyncStatus.SYNCED
                entry.synced_at = timezone.now()
                entry.time_entry = time_entry
                entry.save()

                synced.append({
                    'id': entry.id,
                    'time_entry_id': time_entry.id,
                    'timestamp': entry.timestamp.isoformat()
                })

            except Exception as e:
                entry.sync_status = OfflineTimeEntry.SyncStatus.FAILED
                entry.sync_error = str(e)
                entry.save()

                failed.append({
                    'id': entry.id,
                    'error': str(e)
                })

        return Response({
            'synced': synced,
            'failed': failed,
            'total': len(synced) + len(failed)
        })

    @action(detail=False, methods=['get'])
    def pending_count(self, request):
        """Numero di entries in attesa di sync"""
        count = self.get_queryset().filter(
            sync_status=OfflineTimeEntry.SyncStatus.PENDING
        ).count()

        return Response({'pending': count})


class AbsenceTypeViewSet(viewsets.ModelViewSet):
    """ViewSet per tipologie di assenza"""

    serializer_class = AbsenceTypeSerializer

    def get_queryset(self):
        user = self.request.user
        company = getattr(user, 'company', None)

        if user.role in ['super_admin', 'platform_owner']:
            return AbsenceType.objects.all()

        if company:
            return AbsenceType.objects.filter(company=company)

        return AbsenceType.objects.none()

    @action(detail=False, methods=['get'])
    def requires_certificate(self, request):
        """Tipologie che richiedono certificato"""
        types = self.get_queryset().filter(
            requires_certificate=True,
            is_active=True
        )
        serializer = self.get_serializer(types, many=True)
        return Response(serializer.data)


class MedicalDashboardView(APIView):
    """Dashboard per visualizzazione company e consulente"""

    def get(self, request):
        user = request.user
        company = getattr(user, 'company', None)

        if user.role in ['super_admin', 'platform_owner']:
            # Super admin vede tutto
            queryset = MedicalCertificate.objects
        elif company:
            queryset = MedicalCertificate.objects.filter(company=company)
        elif user.role == 'external_consultant':
            queryset = MedicalCertificate.objects.filter(
                company__in=user.consultant_links.values_list('company', flat=True)
            )
        else:
            return Response({'error': 'Access denied'}, status=403)

        today = timezone.now().date()

        # Statistiche certificati
        stats = {
            'active_certificates': queryset.filter(
                status=MedicalCertificate.Status.VALIDATED,
                start_date__lte=today,
                end_date__gte=today
            ).count(),
            'pending_validation': queryset.filter(
                status=MedicalCertificate.Status.PENDING
            ).count(),
            'expiring_soon': queryset.filter(
                status=MedicalCertificate.Status.VALIDATED,
                end_date__lte=today + timedelta(days=7),
                end_date__gte=today
            ).count(),
            'total_month': queryset.filter(
                start_date__month=today.month,
                start_date__year=today.year
            ).count(),
        }

        # Visite mediche stats
        if user.role in ['super_admin', 'platform_owner']:
            visit_queryset = MedicalVisit.objects
        elif company:
            visit_queryset = MedicalVisit.objects.filter(company=company)
        else:
            visit_queryset = MedicalVisit.objects.filter(
                company__in=user.consultant_links.values_list('company', flat=True)
            )

        stats['scheduled_visits'] = visit_queryset.filter(
            status=MedicalVisit.Status.SCHEDULED
        ).count()
        stats['overdue_visits'] = visit_queryset.filter(
            status=MedicalVisit.Status.SCHEDULED,
            scheduled_date__lt=today
        ).count()

        # Lista certificati attivi
        active = queryset.filter(
            status=MedicalCertificate.Status.VALIDATED,
            start_date__lte=today,
            end_date__gte=today
        ).select_related('employee', 'employee__user')[:10]

        # Lista certificati in scadenza
        expiring = queryset.filter(
            status=MedicalCertificate.Status.VALIDATED,
            end_date__lte=today + timedelta(days=7),
            end_date__gte=today
        ).select_related('employee', 'employee__user')[:10]

        return Response({
            'stats': stats,
            'active_certificates': MedicalCertificateSerializer(active, many=True).data,
            'expiring_certificates': MedicalCertificateSerializer(expiring, many=True).data,
        })


class CheckInWithCertificateView(APIView):
    """Check-in con inserimento codice certificato medico"""

    def post(self, request):
        user = request.user
        company = getattr(user, 'company', None)

        if not company:
            return Response({'error': 'No company'}, status=400)

        # Verifica se l'utente ha un certificato attivo oggi
        today = timezone.now().date()
        employee = getattr(user, 'employee_profile', None)

        if not employee:
            return Response({'error': 'No employee profile'}, status=400)

        active_cert = MedicalCertificate.objects.filter(
            employee=employee,
            status=MedicalCertificate.Status.VALIDATED,
            start_date__lte=today,
            end_date__gte=today
        ).first()

        # Crea TimeEntry
        entry_type = request.data.get('entry_type', 'check_in')
        timestamp = request.data.get('timestamp', timezone.now())

        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))

        time_entry = TimeEntry.objects.create(
            user=user,
            company=company,
            created_by=user,
            entry_type=entry_type,
            timestamp=timestamp,
            source=request.data.get('source', 'web'),
            latitude=request.data.get('latitude'),
            longitude=request.data.get('longitude'),
            notes=request.data.get('notes', '')
        )

        response_data = {
            'id': time_entry.id,
            'entry_type': time_entry.entry_type,
            'timestamp': time_entry.timestamp.isoformat(),
            'certificate_active': active_cert is not None,
        }

        if active_cert:
            response_data['certificate_info'] = {
                'type': active_cert.get_certificate_type_display(),
                'end_date': active_cert.end_date.isoformat(),
                'inps_code': active_cert.inps_code,
            }

        return Response(response_data, status=201)