"""
Viste per SSO/SAML authentication
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import redirect
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from urllib.parse import urlencode
import hashlib
import base64
import zlib
import xml.etree.ElementTree as ET

from users.models import SSOProvider, SSOUserLink, SSOSession
from users.models import User
from users.serializers import UserSerializer


def generate_saml_request(provider):
    """Genera SAML AuthnRequest"""
    import uuid

    request_id = f"_{uuid.uuid4().hex}"
    issue_instant = timezone.now().strftime("%Y-%m-%dT%H:%M:%SZ")

    saml_ns = {
        'samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
        'saml': 'urn:oasis:names:tc:SAML:2.0:assertion'
    }

    root = ET.Element('samlp:AuthnRequest', {
        'xmlns:samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
        'xmlns:saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
        'ID': request_id,
        'Version': '2.0',
        'IssueInstant': issue_instant,
        'AssertionConsumerServiceURL': f"{settings.PULSEHR_BASE_URL}/api/auth/saml/acs/",
        'ProtocolBinding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST'
    })

    # Issuer
    issuer = ET.SubElement(root, 'saml:Issuer')
    issuer.text = settings.PULSEHR_ENTITY_ID

    # NameID Policy
    nameid = ET.SubElement(root, 'samlp:NameIDPolicy', {
        'Format': 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        'AllowCreate': 'true'
    })

    # Comprimi e codifica
    xml_str = ET.tostring(root, encoding='unicode')
    compressed = zlib.compress(xml_str.encode('utf-8'))[2:-4]  # raw deflate
    encoded = base64.b64encode(compressed).decode('utf-8')

    return encoded, request_id


def authenticate_saml_user(provider, email, attributes):
    """
    Autentica o crea utente basato su attributi SAML.
    Se l'utente esiste gia', lo collega al provider SSO.
    Se non esiste, crea un nuovo utente e lo collega.
    """
    from users.models import SSOUserLink

    # Estrai attributi utente
    first_name = attributes.get(provider.first_name_mapping, '')
    last_name = attributes.get(provider.last_name_mapping, '')

    # Cerca utente esistente collegato a questo provider
    try:
        sso_link = SSOUserLink.objects.select_related('user', 'user__company').get(
            provider=provider,
            remote_user_id=email
        )
        user = sso_link.user
        sso_link.last_sso_login = timezone.now()
        sso_link.save(update_fields=['last_sso_login'])
        return user
    except SSOUserLink.DoesNotExist:
        pass

    # Cerca utente per email
    try:
        user = User.objects.get(email=email)
        # Collega utente esistente al provider
        SSOUserLink.objects.create(
            user=user,
            provider=provider,
            remote_user_id=email,
            last_sso_login=timezone.now()
        )
        return user
    except User.DoesNotExist:
        pass

    # Crea nuovo utente se l'azienda esiste
    if provider.company:
        user = User.objects.create(
            email=email,
            first_name=first_name or '',
            last_name=last_name or '',
            company=provider.company,
            role=User.RoleChoices.EMPLOYEE,
            is_active=True
        )
        SSOUserLink.objects.create(
            user=user,
            provider=provider,
            remote_user_id=email,
            last_sso_login=timezone.now()
        )
        return user

    raise ValueError(f"Impossibile autenticare utente: {email}")


class SSOInitView(APIView):
    """Inizializza login SSO"""
    permission_classes = [AllowAny]

    def get(self, request, company_slug):
        """Redirect all'IdP"""
        try:
            provider = SSOProvider.objects.select_related('company').get(
                company__slug=company_slug,
                is_active=True
            )
        except SSOProvider.DoesNotExist:
            return Response(
                {"detail": "SSO non configurato per questa azienda"},
                status=404
            )

        if provider.provider_type == 'saml':
            saml_request, request_id = generate_saml_request(provider)

            # Memorizza request_id in sessione
            request.session['saml_request_id'] = request_id
            request.session['saml_provider_id'] = str(provider.id)

            # Redirect all'IdP
            params = {
                'SAMLRequest': saml_request,
                'RelayState': request.GET.get('next', '/dashboard/')
            }

            return redirect(f"{provider.sso_url}?{urlencode(params)}")

        elif provider.provider_type == 'oidc':
            # OIDC flow
            state = hashlib.sha256(str(timezone.now()).encode()).hexdigest()[:32]
            request.session['oidc_state'] = state
            request.session['oidc_provider_id'] = str(provider.id)

            auth_url = f"{provider.issuer_url}/authorize?"
            params = {
                'client_id': provider.client_id,
                'response_type': 'code',
                'scope': 'openid email profile',
                'redirect_uri': f"{settings.PULSEHR_BASE_URL}/api/auth/oidc/callback/",
                'state': state
            }

            return redirect(auth_url + urlencode(params))

        return Response(
            {"detail": "Provider type non supportato"},
            status=400
        )


class SAMLACSView(APIView):
    """Assertion Consumer Service - callback SAML"""
    permission_classes = [AllowAny]

    def post(self, request):
        saml_response = request.POST.get('SAMLResponse')
        relay_state = request.POST.get('RelayState', '/dashboard/')

        if not saml_response:
            return Response({"detail": "SAMLResponse mancante"}, status=400)

        try:
            # Decodifica e valida risposta
            decoded = base64.b64decode(saml_response).decode('utf-8')
            # TODO: Validazione firma con cert del provider

            # Parse XML
            root = ET.fromstring(decoded)

            # Estrai dati utente
            ns = {'saml': 'urn:oasis:names:tc:SAML:2.0:assertion'}

            name_id = root.find('.//saml:NameID', ns)
            email = name_id.text if name_id is not None else None

            attributes = {}
            for attr in root.findall('.//saml:Attribute', ns):
                name = attr.get('Name')
                value = attr.find('saml:AttributeValue', ns)
                if name and value is not None:
                    attributes[name] = value.text

            # Trova provider
            provider_id = request.session.get('saml_provider_id')
            provider = SSOProvider.objects.get(id=provider_id)

            # Autentica o crea utente
            user = authenticate_saml_user(provider, email, attributes)

            # Crea token
            from rest_framework.authtoken.models import Token
            token, _ = Token.objects.get_or_create(user=user)

            # Aggiorna ultimo login SSO
            try:
                sso_link = SSOUserLink.objects.get(user=user, provider=provider)
                sso_link.last_sso_login = timezone.now()
                sso_link.save(update_fields=['last_sso_login'])
            except SSOUserLink.DoesNotExist:
                pass

            # Crea sessione SSO
            SSOSession.objects.create(
                user=user,
                provider=provider,
                session_index=name_id.text if name_id else None,
                expires_at=timezone.now() + timedelta(hours=8),
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )

            return Response({
                "token": token.key,
                "user": UserSerializer(user).data,
                "sso_provider": provider.provider_type
            })

        except SSOProvider.DoesNotExist:
            return Response(
                {"detail": "Provider SSO non trovato"},
                status=400
            )
        except Exception as e:
            return Response(
                {"detail": f"Errore validazione SAML: {str(e)}"},
                status=400
            )


class OIDCCallbackView(APIView):
    """Callback per OIDC flow"""
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.GET.get('code')
        state = request.GET.get('state')
        error = request.GET.get('error')

        if error:
            return Response(
                {"detail": f"OIDC Error: {error}"},
                status=400
            )

        if not code or not state:
            return Response(
                {"detail": "Codice o stato mancante"},
                status=400
            )

        # Valida state
        stored_state = request.session.get('oidc_state')
        if state != stored_state:
            return Response(
                {"detail": "State non valido"},
                status=400
            )

        provider_id = request.session.get('oidc_provider_id')
        try:
            provider = SSOProvider.objects.get(id=provider_id)
        except SSOProvider.DoesNotExist:
            return Response(
                {"detail": "Provider OIDC non trovato"},
                status=400
            )

        # Scambia code per token
        import requests
        token_url = f"{provider.issuer_url}/token"

        try:
            response = requests.post(token_url, data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': f"{settings.PULSEHR_BASE_URL}/api/auth/oidc/callback/",
                'client_id': provider.client_id,
                'client_secret': provider.client_secret,
            }, timeout=30)

            if response.status_code != 200:
                return Response(
                    {"detail": "Errore获取token"},
                    status=400
                )

            token_data = response.json()
            access_token = token_data.get('access_token')

            # Ottieni userinfo
            userinfo_url = f"{provider.issuer_url}/userinfo"
            userinfo_response = requests.get(
                userinfo_url,
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=30
            )

            if userinfo_response.status_code != 200:
                return Response(
                    {"detail": "Errore获取用户信息"},
                    status=400
                )

            userinfo = userinfo_response.json()
            email = userinfo.get(provider.email_mapping, '')
            first_name = userinfo.get(provider.first_name_mapping, '')
            last_name = userinfo.get(provider.last_name_mapping, '')

            attributes = {
                provider.email_mapping: email,
                provider.first_name_mapping: first_name,
                provider.last_name_mapping: last_name,
            }

            # Autentica utente
            user = authenticate_saml_user(provider, email, attributes)

            # Crea token
            from rest_framework.authtoken.models import Token
            token, _ = Token.objects.get_or_create(user=user)

            # Aggiorna ultimo login
            try:
                sso_link = SSOUserLink.objects.get(user=user, provider=provider)
                sso_link.last_sso_login = timezone.now()
                sso_link.save(update_fields=['last_sso_login'])
            except SSOUserLink.DoesNotExist:
                pass

            # Pulisci sessione
            for key in ['oidc_state', 'oidc_provider_id']:
                if key in request.session:
                    del request.session[key]

            return Response({
                "token": token.key,
                "user": UserSerializer(user).data,
                "sso_provider": provider.provider_type
            })

        except requests.RequestException as e:
            return Response(
                {"detail": f"Errore di rete: {str(e)}"},
                status=400
            )
        except Exception as e:
            return Response(
                {"detail": f"Errore OIDC: {str(e)}"},
                status=400
            )


class SAMLMetadataView(APIView):
    """Metadata SAML per SP (Service Provider)"""
    permission_classes = [AllowAny]

    def get(self, request):
        """Genera metadata XML per il Service Provider"""
        try:
            provider_id = request.session.get('saml_provider_id')
            if provider_id:
                provider = SSOProvider.objects.get(id=provider_id)
            else:
                # Restituisci metadata generici se non c'e provider in sessione
                pass

            # Genera metadata SP
            metadata_id = f"_{timezone.now().strftime('%Y%m%d%H%M%S')}"
            issue_instant = timezone.now().strftime("%Y-%m-%dT%H:%M:%SZ")

            root = ET.Element('md:EntityDescriptor', {
                'xmlns:md': 'urn:oasis:names:tc:SAML:2.0:metadata',
                'entityID': settings.PULSEHR_ENTITY_ID,
                'validUntil': (timezone.now() + timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
            })

            spsso = ET.SubElement(root, 'md:SPSSODescriptor', {
                'xmlns:md': 'urn:oasis:names:tc:SAML:2.0:metadata',
                'AuthnRequestsSigned': 'false',
                'WantAssertionsSigned': 'true',
                'protocolSupportEnumeration': 'urn:oasis:names:tc:SAML:2.0:protocol'
            })

# AssertionConsumerService
            acs = ET.SubElement(spsso, 'md:AssertionConsumerService', {
                'Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
                'Location': f"{settings.PULSEHR_BASE_URL}/api/auth/saml/acs/",
                'index': '0',
                'isDefault': 'true'
            })

            # SingleLogoutService
            sls = ET.SubElement(spsso, 'md:SingleLogoutService', {
                'Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                'Location': f"{settings.PULSEHR_BASE_URL}/api/auth/saml/sls/"
            })

            # NameIDFormat
            nameid_format = ET.SubElement(spsso, 'md:NameIDFormat')
            nameid_format.text = 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'

            # Organization
            org = ET.SubElement(root, 'md:Organization', {
                'xmlns:md': 'urn:oasis:names:tc:SAML:2.0:metadata'
            })
            org_name = ET.SubElement(org, 'md:OrganizationName', {
                'xml:lang': 'it'
            })
            org_name.text = 'PulseHR'
            org_display = ET.SubElement(org, 'md:OrganizationDisplayName', {
                'xml:lang': 'it'
            })
            org_display.text = 'PulseHR - Enterprise HR Management'
            org_url = ET.SubElement(org, 'md:OrganizationURL', {
                'xml:lang': 'it'
            })
            org_url.text = settings.PULSEHR_BASE_URL

            # Technical Contact
            tech = ET.SubElement(root, 'md:ContactPerson', {
                'contactType': 'technical'
            })
            email_elem = ET.SubElement(tech, 'md:EmailAddress')
            email_elem.text = 'tech@pulsehr.it'

            xml_str = ET.tostring(root, encoding='unicode')
            xml_str = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml_str

            from django.http import HttpResponse
            return HttpResponse(xml_str, content_type='application/xml')

        except Exception as e:
            return Response(
                {"detail": f"Errore generazione metadata: {str(e)}"},
                status=500
            )


class SSOConfigView(APIView):
    """Configurazione SSO per admin"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Mostra configurazione SSO attuale"""
        if not request.user.company:
            return Response({"detail": "Utente non associato ad azienda"}, status=400)

        try:
            provider = SSOProvider.objects.get(company=request.user.company)

            return Response({
                "provider_type": provider.provider_type,
                "entity_id": provider.entity_id,
                "is_active": provider.is_active,
                "enforce_sso": provider.enforce_sso,
                "acs_url": f"{settings.PULSEHR_BASE_URL}/api/auth/saml/acs/",
                "metadata_url": f"{settings.PULSEHR_BASE_URL}/api/auth/saml/metadata/"
            })
        except SSOProvider.DoesNotExist:
            return Response({"detail": "SSO non configurato"}, status=404)

    def post(self, request):
        """Configura o aggiorna SSO"""
        if not request.user.company:
            return Response({"detail": "Utente non associato ad azienda"}, status=400)

        if not request.user.is_platform_admin and request.user.role not in [
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN
        ]:
            return Response({"detail": "Permessi insufficienti"}, status=403)

        data = request.data
        provider_type = data.get('provider_type')

        if provider_type not in ['saml', 'oidc']:
            return Response(
                {"detail": "Provider type deve essere 'saml' o 'oidc'"},
                status=400
            )

        try:
            provider, created = SSOProvider.objects.update_or_create(
                company=request.user.company,
                defaults={
                    'provider_type': provider_type,
                    'entity_id': data.get('entity_id', ''),
                    'sso_url': data.get('sso_url', ''),
                    'slo_url': data.get('slo_url', ''),
                    'x509_cert': data.get('x509_cert', ''),
                    'client_id': data.get('client_id', ''),
                    'client_secret': data.get('client_secret', ''),
                    'issuer_url': data.get('issuer_url', ''),
                    'email_mapping': data.get('email_mapping', 'email'),
                    'first_name_mapping': data.get('first_name_mapping', 'given_name'),
                    'last_name_mapping': data.get('last_name_mapping', 'family_name'),
                    'is_active': data.get('is_active', True),
                    'enforce_sso': data.get('enforce_sso', False),
                }
            )

            return Response({
                "id": str(provider.id),
                "provider_type": provider.provider_type,
                "entity_id": provider.entity_id,
                "is_active": provider.is_active,
                "enforce_sso": provider.enforce_sso,
                "created": created
            }, status=201 if created else 200)

        except Exception as e:
            return Response(
                {"detail": f"Errore configurazione SSO: {str(e)}"},
                status=400
            )

    def delete(self, request):
        """Rimuovi configurazione SSO"""
        if not request.user.company:
            return Response({"detail": "Utente non associato ad azienda"}, status=400)

        if not request.user.is_platform_admin and request.user.role not in [
            User.RoleChoices.COMPANY_OWNER,
            User.RoleChoices.COMPANY_ADMIN
        ]:
            return Response({"detail": "Permessi insufficienti"}, status=403)

        try:
            provider = SSOProvider.objects.get(company=request.user.company)
            provider.delete()
            return Response(status=204)
        except SSOProvider.DoesNotExist:
            return Response({"detail": "SSO non configurato"}, status=404)


class SSOLogoutView(APIView):
    """Logout SSO - SLO (Single Logout)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Gestisce logout SSO"""
        user = request.user

        # Invalida sessioni SSO attive
        SSOSession.objects.filter(user=user).update(
            expires_at=timezone.now()
        )

        # Se il provider supporta SLO, redirect
        try:
            provider = SSOProvider.objects.get(
                company=user.company,
                is_active=True
            )

            if provider.slo_url:
                if provider.provider_type == 'saml':
                    slo_request, request_id = generate_saml_request(provider)
                    request.session['slo_request_id'] = request_id

                    params = {
                        'SAMLRequest': slo_request,
                        'RelayState': '/'
                    }
                    return redirect(f"{provider.slo_url}?{urlencode(params)}")

        except SSOProvider.DoesNotExist:
            pass

        return Response({"detail": "Logout effettuato"})


def get_client_ip(request):
    """Ottieni IP client dalla richiesta"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR')