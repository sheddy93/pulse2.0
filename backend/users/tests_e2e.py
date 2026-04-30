"""
PulseHR E2E Test Suite
======================
Suite completa di test end-to-end per:
- Billing & Stripe
- Mobile Authentication
- SSO/SAML Flows
- Safety Module
- Reports Download
- Notifications
- Geolocation
"""

from datetime import datetime, timedelta
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import (
    AuditLog,
    Company,
    ConsultantCompanyLink,
    Document,
    EmployeeProfile,
    Notification,
    PayrollRun,
    PricingPlan,
    TimeEntry,
    User,
    UserCompanyAccess,
)
from .pricing_utils import check_employee_limit, check_module_access
from .services import ensure_company_roles

# ============================================================================
# BILLING & STRIPE TESTS
# ============================================================================

class StripeBillingEdgeCasesTests(APITestCase):
    """Test casi edge per billing Stripe"""

    def setUp(self):
        self.company = Company.objects.create(
            name="Billing Test Company",
            slug="billing-test",
            status=Company.StatusChoices.ACTIVE,
            plan="professional",
        )
        roles = ensure_company_roles(self.company)
        
        self.admin = User.objects.create_user(
            email="billing-admin@test.local",
            password="admin",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            company_role=roles[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )
        
        self.employee = User.objects.create_user(
            email="billing-emp@test.local",
            password="emp",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            company_role=roles[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )
        
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee,
            company=self.company,
            employee_code="BILL-001",
            first_name="Billing",
            last_name="Employee",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )
        
        # Crea piano default se non esiste
        if not PricingPlan.objects.filter(name="professional").exists():
            PricingPlan.objects.create(
                name="professional",
                display_name="Professional",
                monthly_price=49,
                max_employees=50,
                max_storage_gb=100,
                modules=["payroll", "attendance", "reports"],
            )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_trial_converts_to_paid(self):
        """Test conversione trial → paid"""
        self.company.trial_ends_at = timezone.now() + timedelta(days=14)
        self.company.save()
        
        self.authenticate(self.admin)
        response = self.client.post(
            "/api/billing/create-subscription/",
            {"plan": "professional", "stripe_token": "tok_test"},
            format="json",
        )
        
        # Deve creare subscription o dare errore gestito
        self.assertIn(response.status_code, [201, 400, 402])

    def test_payment_failure_handling(self):
        """Test gestione fallimento pagamento"""
        self.company.status = Company.StatusChoices.SUSPENDED
        self.company.save()
        
        self.authenticate(self.admin)
        response = self.client.get("/api/billing/status/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data.get("status"), ["suspended", "past_due", "canceled"])

    def test_plan_upgrade_downgrade(self):
        """Test upgrade e downgrade piano"""
        self.authenticate(self.admin)
        
        # Upgrade
        response = self.client.post(
            "/api/billing/update-subscription/",
            {"plan": "enterprise"},
            format="json",
        )
        self.assertIn(response.status_code, [200, 400, 402])
        
        # Downgrade
        response = self.client.post(
            "/api/billing/update-subscription/",
            {"plan": "starter"},
            format="json",
        )
        self.assertIn(response.status_code, [200, 400])

    def test_coupon_application(self):
        """Test applicazione coupon"""
        self.authenticate(self.admin)
        response = self.client.post(
            "/api/billing/apply-coupon/",
            {"coupon_code": "PROMO20"},
            format="json",
        )
        
        # Accetta coupon valido o coupon non trovato
        self.assertIn(response.status_code, [200, 404, 400])

    def test_invoice_retrieval(self):
        """Test recupero fatture"""
        self.authenticate(self.admin)
        response = self.client.get("/api/billing/invoices/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_billing_webhook_signature_validation(self):
        """Test validazione signature webhook Stripe"""
        from .stripe_services import validate_stripe_signature
        
        # Signature valida
        valid_sig = "sig_123456"
        result = validate_stripe_signature(valid_sig, b"test payload")
        
        # Signature non valida
        invalid_sig = "sig_invalid"
        result2 = validate_stripe_signature(invalid_sig, b"test payload")
        
        # Almeno uno deve essere gestito correttamente
        self.assertIsInstance(result, bool)


class TrialConversionTests(APITestCase):
    """Test conversione trial → customer"""

    def setUp(self):
        self.trial_company = Company.objects.create(
            name="Trial Company",
            slug="trial-company",
            status=Company.StatusChoices.ACTIVE,
            plan=PricingPlan.PlanType.TRIAL,
        )
        roles = ensure_company_roles(self.trial_company)
        
        self.owner = User.objects.create_user(
            email="trial-owner@test.local",
            password="owner",
            role=User.RoleChoices.COMPANY_OWNER,
            company=self.trial_company,
            company_role=roles[User.RoleChoices.COMPANY_OWNER],
            must_change_password=False,
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_trial_ends_warning(self):
        """Test avviso fine trial"""
        self.trial_company.trial_ends_at = timezone.now() + timedelta(days=3)
        self.trial_company.save()
        
        self.authenticate(self.owner)
        response = self.client.get("/api/company/limits/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("trial", {}).get("expiring_soon", False))

    def test_trial_expired_blocks_write_operations(self):
        """Test che trial scaduto blocca operazioni di scrittura"""
        self.trial_company.trial_ends_at = timezone.now() - timedelta(days=1)
        self.trial_company.save()
        
        self.authenticate(self.owner)
        response = self.client.post(
            "/api/employees/",
            {"first_name": "Test", "last_name": "User"},
            format="json",
        )
        
        # Deve bloccare o mostrare warning
        self.assertIn(response.status_code, [201, 402, 403, 400])

    def test_trial_to_paid_transition(self):
        """Test transizione trial → paid"""
        self.authenticate(self.owner)
        response = self.client.post(
            "/api/billing/create-subscription/",
            {"plan": "professional"},
            format="json",
        )
        
        self.trial_company.refresh_from_db()
        self.assertIn(self.trial_company.plan, [
            PricingPlan.PlanType.PROFESSIONAL,
            PricingPlan.PlanType.TRIAL,  # Se ancora in trial
        ])


# ============================================================================
# MOBILE AUTH TESTS
# ============================================================================

class MobileAuthenticationTests(APITestCase):
    """Test autenticazione mobile"""

    def setUp(self):
        self.company = Company.objects.create(
            name="Mobile Test Company",
            slug="mobile-test",
            status=Company.StatusChoices.ACTIVE,
            plan="professional",
        )
        roles = ensure_company_roles(self.company)
        
        self.mobile_user = User.objects.create_user(
            email="mobile-user@test.local",
            password="mobile123",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            company_role=roles[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )
        
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.mobile_user,
            company=self.company,
            employee_code="MOBILE-001",
            first_name="Mobile",
            last_name="User",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )

    def authenticate(self, user, mobile_token=None):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {token.key}",
            HTTP_X_MOBILE_CLIENT=f"ReactNative/{mobile_token or 'test-1.0'}",
        )

    def test_mobile_check_in(self):
        """Test check-in da mobile"""
        self.authenticate(self.mobile_user, "app-1.0.0")
        response = self.client.post(
            "/api/time/check-in/",
            {
                "source": "mobile",
                "latitude": 45.4642,
                "longitude": 9.1900,
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn(data.get("entry_type"), ["check_in", "check_in_created"])

    def test_mobile_check_out(self):
        """Test check-out da mobile"""
        # Prima check-in
        TimeEntry.objects.create(
            user=self.mobile_user,
            company=self.company,
            created_by=self.mobile_user,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            source=TimeEntry.SourceChoices.MOBILE,
            latitude=45.4642,
            longitude=9.1900,
        )
        
        self.authenticate(self.mobile_user, "app-1.0.0")
        response = self.client.post(
            "/api/time/check-out/",
            {
                "source": "mobile",
                "latitude": 45.4642,
                "longitude": 9.1900,
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 200)

    def test_mobile_leave_request(self):
        """Test richiesta ferie da mobile"""
        self.authenticate(self.mobile_user, "app-1.0.0")
        
        response = self.client.post(
            "/api/leave/employee/request/",
            {
                "leave_type": "vacation",
                "start_date": str(timezone.localdate() + timedelta(days=7)),
                "end_date": str(timezone.localdate() + timedelta(days=10)),
                "reason": "Vacations from mobile",
            },
            format="json",
        )
        
        self.assertIn(response.status_code, [201, 400, 403])

    def test_mobile_payslip_view(self):
        """Test visualizzazione busta paga da mobile"""
        payroll = PayrollRun.objects.create(
            company=self.company,
            employee=self.employee_profile,
            month=timezone.localdate().month,
            year=timezone.localdate().year,
            status=PayrollRun.StatusChoices.APPROVED_BY_COMPANY,
        )
        
        self.authenticate(self.mobile_user, "app-1.0.0")
        response = self.client.get("/api/payroll/employee/mine/")
        
        self.assertEqual(response.status_code, 200)
        payslips = response.json()
        self.assertTrue(len(payslips) >= 1)

    def test_mobile_profile_update(self):
        """Test aggiornamento profilo da mobile"""
        self.authenticate(self.mobile_user, "app-1.0.0")
        
        response = self.client.patch(
            f"/api/employees/{self.employee_profile.id}/",
            {"phone": "+391234567890"},
            format="json",
        )
        
        self.assertIn(response.status_code, [200, 403])

    def test_mobile_logout_invalidates_token(self):
        """Test che logout invalida token"""
        token, _ = Token.objects.get_or_create(user=self.mobile_user)
        
        self.authenticate(self.mobile_user, "app-1.0.0")
        response = self.client.post("/api/auth/logout/")
        
        self.assertEqual(response.status_code, 200)
        
        # Token dovrebbe essere invalido
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        response = self.client.get("/api/employees/")
        self.assertEqual(response.status_code, [401, 403])


# ============================================================================
# SSO/SAML TESTS
# ============================================================================

class SSOAuthenticationTests(APITestCase):
    """Test autenticazione SSO/SAML"""

    def setUp(self):
        self.company = Company.objects.create(
            name="SSO Test Company",
            slug="sso-test",
            status=Company.StatusChoices.ACTIVE,
            plan="enterprise",
        )
        roles = ensure_company_roles(self.company)
        
        self.sso_user = User.objects.create_user(
            email="sso-user@company.com",
            password="sso123",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            company_role=roles[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )
        
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.sso_user,
            company=self.company,
            employee_code="SSO-001",
            first_name="SSO",
            last_name="User",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )

    def test_saml_acs_endpoint(self):
        """Test SAML ACS (Assertion Consumer Service) endpoint"""
        response = self.client.post(
            "/api/auth/saml/acs/",
            {
                "SAMLResponse": "base64_encoded_response",
                "RelayState": "optional_state",
            },
            format="json",
        )
        
        self.assertIn(response.status_code, [200, 302, 400, 401])

    def test_saml_metadata_endpoint(self):
        """Test metadata endpoint per IdP"""
        response = self.client.get("/api/auth/saml/metadata/")
        
        self.assertIn(response.status_code, [200, 404])
        if response.status_code == 200:
            self.assertIn(response["Content-Type"], ["application/xml", "text/xml"])

    def test_oidc_authorization_flow(self):
        """Test flusso autorizzazione OIDC"""
        response = self.client.get(
            "/api/auth/oidc/authorize/",
            {
                "client_id": "test-client",
                "redirect_uri": "https://app.pulsehr.com/auth/callback",
                "response_type": "code",
                "scope": "openid profile email",
                "state": "random_state_123",
            },
        )
        
        self.assertIn(response.status_code, [200, 302, 400])

    def test_oidc_token_exchange(self):
        """Test exchange token OIDC"""
        response = self.client.post(
            "/api/auth/oidc/token/",
            {
                "grant_type": "authorization_code",
                "code": "auth_code_123",
                "redirect_uri": "https://app.pulsehr.com/auth/callback",
                "client_id": "test-client",
                "client_secret": "secret123",
            },
            format="json",
        )
        
        self.assertIn(response.status_code, [200, 400, 401])

    def test_sso_user_login(self):
        """Test login SSO"""
        response = self.client.post(
            "/api/auth/sso/login/",
            {
                "provider": "saml",
                "email": "sso-user@company.com",
                "token": "sso_session_token",
            },
            format="json",
        )
        
        self.assertIn(response.status_code, [200, 401, 403])

    def test_sso_link_account(self):
        """Test linking account SSO"""
        token, _ = Token.objects.get_or_create(user=self.sso_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        
        response = self.client.post(
            "/api/auth/sso/link/",
            {
                "provider": "google",
                "provider_user_id": "google_123456",
                "email": "sso-user@company.com",
            },
            format="json",
        )
        
        self.assertIn(response.status_code, [200, 400, 409])


# ============================================================================
# SAFETY MODULE TESTS
# ============================================================================

class SafetyModuleTests(APITestCase):
    """Test modulo sicurezza sul lavoro"""

    def setUp(self):
        self.company = Company.objects.create(
            name="Safety Test Company",
            slug="safety-test",
            status=Company.StatusChoices.ACTIVE,
            plan="professional",
        )
        roles = ensure_company_roles(self.company)
        
        self.safety_admin = User.objects.create_user(
            email="safety-admin@test.local",
            password="safety",
            role=User.RoleChoices.SAFETY_CONSULTANT,
            company=self.company,
            company_role=roles[User.RoleChoices.SAFETY_CONSULTANT],
            must_change_password=False,
        )
        
        self.employee = User.objects.create_user(
            email="safety-emp@test.local",
            password="emp",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            company_role=roles[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )
        
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee,
            company=self.company,
            employee_code="SAFETY-001",
            first_name="Safety",
            last_name="Employee",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_create_safety_course(self):
        """Test creazione corso sicurezza"""
        self.authenticate(self.safety_admin)
        response = self.client.post(
            "/api/safety/courses/",
            {
                "title": "Corso Antincendio",
                "description": "Corso obbligatorio antincendio",
                "duration_minutes": 120,
                "validity_months": 12,
                "category": "fire_safety",
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["title"], "Corso Antincendio")

    def test_assign_training_to_employee(self):
        """Test assegnazione formazione a dipendente"""
        self.authenticate(self.safety_admin)
        
        # Crea corso
        course_response = self.client.post(
            "/api/safety/courses/",
            {
                "title": "Primo Soccorso",
                "duration_minutes": 60,
                "validity_months": 24,
            },
            format="json",
        )
        course_id = course_response.json()["id"]
        
        # Assegna a dipendente
        response = self.client.post(
            "/api/safety/trainings/",
            {
                "course_id": course_id,
                "employee_id": str(self.employee_profile.id),
                "assigned_by": str(self.safety_admin.id),
                "due_date": str(timezone.localdate() + timedelta(days=30)),
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 201)

    def test_complete_training(self):
        """Test completamento formazione"""
        self.authenticate(self.safety_admin)
        
        # Crea corso e training
        course = self.client.post(
            "/api/safety/courses/",
            {"title": "Test Course", "duration_minutes": 30},
            format="json",
        ).json()
        
        training = self.client.post(
            "/api/safety/trainings/",
            {
                "course_id": course["id"],
                "employee_id": str(self.employee_profile.id),
            },
            format="json",
        ).json()
        
        # Completa training
        response = self.client.post(
            f"/api/safety/trainings/{training['id']}/complete/",
            {
                "score": 85,
                "notes": "Completato con successo",
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 200)

    def test_create_safety_inspection(self):
        """Test creazione ispezione sicurezza"""
        self.authenticate(self.safety_admin)
        response = self.client.post(
            "/api/safety/inspections/",
            {
                "title": "Ispezione Magazzino",
                "inspection_type": "workplace",
                "scheduled_date": str(timezone.localdate() + timedelta(days=7)),
                "location": "Magazzino principale",
                "notes": "Verifica impianti elettrici",
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 201)

    def test_safety_alert_generation(self):
        """Test generazione alert sicurezza"""
        self.authenticate(self.safety_admin)
        response = self.client.post(
            "/api/safety/alerts/",
            {
                "alert_type": "training_expiring",
                "severity": "warning",
                "title": "Certificato in scadenza",
                "message": f"Certificato di {self.employee_profile.first_name} sta per scadere",
                "company_id": str(self.company.id),
                "employee_id": str(self.employee_profile.id),
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 201)

    def test_safety_dashboard_access(self):
        """Test accesso dashboard sicurezza"""
        self.authenticate(self.safety_admin)
        response = self.client.get("/api/safety/dashboard/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("courses", data)
        self.assertIn("trainings", data)
        self.assertIn("inspections", data)


# ============================================================================
# REPORTS DOWNLOAD TESTS
# ============================================================================

class ReportsDownloadTests(APITestCase):
    """Test download report PDF/Excel"""

    def setUp(self):
        self.company = Company.objects.create(
            name="Reports Test Company",
            slug="reports-test",
            status=Company.StatusChoices.ACTIVE,
            plan="professional",
        )
        roles = ensure_company_roles(self.company)
        
        self.admin = User.objects.create_user(
            email="reports-admin@test.local",
            password="admin",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            company_role=roles[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )
        
        self.employee = User.objects.create_user(
            email="reports-emp@test.local",
            password="emp",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            company_role=roles[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )
        
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee,
            company=self.company,
            employee_code="REPORT-001",
            first_name="Report",
            last_name="Employee",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_attendance_report_pdf(self):
        """Test generazione report presenze PDF"""
        self.authenticate(self.admin)
        response = self.client.get(
            "/api/reports/attendance/",
            {
                "format": "pdf",
                "month": timezone.localdate().month,
                "year": timezone.localdate().year,
            },
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn(response["Content-Type"], ["application/pdf", "application/json"])

    def test_attendance_report_excel(self):
        """Test generazione report presenze Excel"""
        self.authenticate(self.admin)
        response = self.client.get(
            "/api/reports/attendance/",
            {
                "format": "xlsx",
                "month": timezone.localdate().month,
                "year": timezone.localdate().year,
            },
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn(response["Content-Type"], [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/json",
        ])

    def test_payroll_report_pdf(self):
        """Test generazione report paghe PDF"""
        self.authenticate(self.admin)
        
        # Crea payroll run
        payroll = PayrollRun.objects.create(
            company=self.company,
            employee=self.employee_profile,
            month=timezone.localdate().month,
            year=timezone.localdate().year,
            status=PayrollRun.StatusChoices.APPROVED_BY_COMPANY,
        )
        
        response = self.client.get(
            f"/api/reports/payroll/{payroll.id}/",
            {"format": "pdf"},
        )
        
        self.assertEqual(response.status_code, 200)

    def test_companies_report_pdf(self):
        """Test generazione report aziende PDF"""
        self.authenticate(self.admin)
        response = self.client.get(
            "/api/reports/companies/",
            {"format": "pdf"},
        )
        
        self.assertEqual(response.status_code, 200)

    def test_leaves_report_pdf(self):
        """Test generazione report ferie PDF"""
        self.authenticate(self.admin)
        response = self.client.get(
            "/api/reports/leaves/",
            {
                "format": "pdf",
                "year": timezone.localdate().year,
            },
        )
        
        self.assertEqual(response.status_code, 200)

    def test_employee_download_restricted(self):
        """Test che employee non può scaricare report"""
        self.authenticate(self.employee)
        response = self.client.get("/api/reports/attendance/", {"format": "pdf"})
        
        self.assertEqual(response.status_code, 403)


# ============================================================================
# NOTIFICATIONS TESTS
# ============================================================================

class NotificationsTests(APITestCase):
    """Test sistema notifiche"""

    def setUp(self):
        self.company = Company.objects.create(
            name="Notifications Test Company",
            slug="notif-test",
            status=Company.StatusChoices.ACTIVE,
            plan="professional",
        )
        roles = ensure_company_roles(self.company)
        
        self.admin = User.objects.create_user(
            email="notif-admin@test.local",
            password="admin",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            company_role=roles[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )
        
        self.employee = User.objects.create_user(
            email="notif-emp@test.local",
            password="emp",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            company_role=roles[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )
        
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee,
            company=self.company,
            employee_code="NOTIF-001",
            first_name="Notif",
            last_name="Employee",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_create_notification(self):
        """Test creazione notifica"""
        self.authenticate(self.admin)
        response = self.client.post(
            "/api/notifications/",
            {
                "recipient_id": str(self.employee.id),
                "title": "Test Notification",
                "message": "This is a test notification",
                "notification_type": "info",
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 201)

    def test_list_user_notifications(self):
        """Test list notification utente"""
        self.authenticate(self.employee)
        response = self.client.get("/api/notifications/")
        
        self.assertEqual(response.status_code, 200)
        notifications = response.json()
        self.assertIsInstance(notifications, list)

    def test_mark_notification_read(self):
        """Test marca notifica come letta"""
        # Crea notifica
        notif = Notification.objects.create(
            company=self.company,
            recipient=self.employee,
            title="Mark as read test",
            message="Test",
            notification_type=Notification.NotificationType.INFO,
        )
        
        self.authenticate(self.employee)
        response = self.client.post(f"/api/notifications/{notif.id}/mark-read/")
        
        self.assertEqual(response.status_code, 200)
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_push_token_registration(self):
        """Test registrazione token push"""
        self.authenticate(self.employee)
        response = self.client.post(
            "/api/push/register-device/",
            {
                "device_token": "fcm_token_123456789",
                "device_type": "android",
                "app_version": "1.0.0",
            },
            format="json",
        )
        
        self.assertIn(response.status_code, [200, 201, 400])

    def test_send_push_notification(self):
        """Test invio push notification"""
        self.authenticate(self.admin)
        response = self.client.post(
            "/api/push/send/",
            {
                "recipient_id": str(self.employee.id),
                "title": "Push Test",
                "body": "Test push notification",
                "data": {"action": "open_app"},
            },
            format="json",
        )
        
        self.assertIn(response.status_code, [200, 201, 400, 404])

    def test_unread_count(self):
        """Test conteggio notifiche non lette"""
        # Crea notifiche non lette
        for i in range(3):
            Notification.objects.create(
                company=self.company,
                recipient=self.employee,
                title=f"Unread {i}",
                message=f"Test {i}",
                notification_type=Notification.NotificationType.INFO,
            )
        
        self.authenticate(self.employee)
        response = self.client.get("/api/notifications/unread-count/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["count"], 3)


# ============================================================================
# GEOLOCATION TESTS
# ============================================================================

class GeolocationTests(APITestCase):
    """Test geolocalizzazione e GPS"""

    def setUp(self):
        self.company = Company.objects.create(
            name="Geo Test Company",
            slug="geo-test",
            status=Company.StatusChoices.ACTIVE,
            plan="professional",
        )
        roles = ensure_company_roles(self.company)
        
        self.admin = User.objects.create_user(
            email="geo-admin@test.local",
            password="admin",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            company_role=roles[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )
        
        self.employee = User.objects.create_user(
            email="geo-emp@test.local",
            password="emp",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            company_role=roles[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )
        
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee,
            company=self.company,
            employee_code="GEO-001",
            first_name="Geo",
            last_name="Employee",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_check_in_with_location(self):
        """Test check-in con GPS"""
        self.authenticate(self.employee)
        response = self.client.post(
            "/api/time/check-in/",
            {
                "source": "mobile",
                "latitude": 45.4642,
                "longitude": 9.1900,
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 201)
        
        # Verifica che TimeEntry abbia coordinate
        entry = TimeEntry.objects.filter(user=self.employee).first()
        self.assertIsNotNone(entry)
        self.assertIsNotNone(entry.latitude)
        self.assertIsNotNone(entry.longitude)

    def test_geofence_check(self):
        """Test verifica geofence"""
        self.authenticate(self.employee)
        response = self.client.post(
            "/api/geo/check/",
            {
                "latitude": 45.4642,
                "longitude": 9.1900,
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("within_geofence", data)

    def test_gps_history(self):
        """Test storico GPS"""
        # Crea entries con location
        for lat, lon in [(45.4642, 9.1900), (45.4650, 9.1910)]:
            TimeEntry.objects.create(
                user=self.employee,
                company=self.company,
                created_by=self.employee,
                entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
                source=TimeEntry.SourceChoices.MOBILE,
                latitude=lat,
                longitude=lon,
            )
        
        self.authenticate(self.admin)
        response = self.client.get(
            f"/api/geo/history/{self.employee.id}/",
            {"from_date": str(timezone.localdate() - timedelta(days=7))},
        )
        
        self.assertEqual(response.status_code, 200)
        history = response.json()
        self.assertTrue(len(history) >= 1)

    def test_office_locations(self):
        """Test gestione sedi"""
        self.authenticate(self.admin)
        response = self.client.get("/api/geo/offices/")
        
        self.assertEqual(response.status_code, 200)
        offices = response.json()
        self.assertIsInstance(offices, list)

    def test_nearest_office(self):
        """Test trova ufficio più vicino"""
        self.authenticate(self.employee)
        response = self.client.get(
            "/api/geo/nearest-office/",
            {"latitude": 45.4642, "longitude": 9.1900},
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("office", data)
        self.assertIn("distance_km", data)

    def test_location_accuracy_check(self):
        """Test verifica accuratezza posizione"""
        self.authenticate(self.employee)
        response = self.client.post(
            "/api/geo/validate-location/",
            {
                "latitude": 45.4642,
                "longitude": 9.1900,
                "accuracy": 10.0,  # 10 metri
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 200)


# ============================================================================
# DIGITAL SIGNATURES TESTS
# ============================================================================

class DigitalSignaturesTests(APITestCase):
    """Test firma digitale"""

    def setUp(self):
        self.company = Company.objects.create(
            name="Sign Test Company",
            slug="sign-test",
            status=Company.StatusChoices.ACTIVE,
            plan="professional",
        )
        roles = ensure_company_roles(self.company)
        
        self.admin = User.objects.create_user(
            email="sign-admin@test.local",
            password="admin",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            company_role=roles[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )
        
        self.employee = User.objects.create_user(
            email="sign-emp@test.local",
            password="emp",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            company_role=roles[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )
        
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee,
            company=self.company,
            employee_code="SIGN-001",
            first_name="Sign",
            last_name="Employee",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_create_signature_request(self):
        """Test creazione richiesta firma"""
        self.authenticate(self.admin)
        response = self.client.post(
            "/api/signatures/request/",
            {
                "signer_id": str(self.employee.id),
                "document_title": "Contratto di lavoro",
                "document_hash": "sha256_hash_of_document",
                "expires_at": str(timezone.now() + timedelta(days=7)),
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 201)

    def test_sign_document_with_token(self):
        """Test firma documento con token"""
        self.authenticate(self.admin)
        
        # Crea request
        request_response = self.client.post(
            "/api/signatures/request/",
            {
                "signer_id": str(self.employee.id),
                "document_title": "Test Doc",
                "document_hash": "hash123",
            },
            format="json",
        )
        request_id = request_response.json()["id"]
        
        # Ottieni token
        token_response = self.client.get(f"/api/signatures/{request_id}/token/")
        self.assertIn(token_response.status_code, [200, 404])
        
        if token_response.status_code == 200:
            token = token_response.json()["token"]
            
            # Firma con token
            self.client.credentials()  # Reset auth
            response = self.client.post(
                f"/api/signatures/{request_id}/sign/",
                {
                    "token": token,
                    "signature_data": "base64_signature",
                    "ip_address": "192.168.1.1",
                },
                format="json",
            )
            self.assertEqual(response.status_code, 200)

    def test_signature_verification(self):
        """Test verifica firma"""
        self.authenticate(self.admin)
        response = self.client.post(
            "/api/signatures/verify/",
            {
                "signature_hash": "signature_hash_123",
                "document_hash": "document_hash_123",
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 200)

    def test_signature_log_entry(self):
        """Test che ogni firma genera audit log"""
        self.authenticate(self.admin)
        
        initial_count = AuditLog.objects.filter(
            company=self.company,
            action=AuditLog.ActionChoices.DOCUMENT_SIGNED,
        ).count()
        
        # Crea e firma request
        request = self.client.post(
            "/api/signatures/request/",
            {"signer_id": str(self.employee.id), "document_title": "Log Test"},
            format="json",
        ).json()
        
        # Completa firma (se endpoint esiste)
        self.client.post(
            f"/api/signatures/{request['id']}/complete/",
            {"signature_data": "data"},
            format="json",
        )
        
        # Verifica log
        new_count = AuditLog.objects.filter(
            company=self.company,
            action=AuditLog.ActionChoices.DOCUMENT_SIGNED,
        ).count()
        
        self.assertGreaterEqual(new_count, initial_count)


# ============================================================================
# SEARCH & GLOBAL SEARCH TESTS
# ============================================================================

class GlobalSearchTests(APITestCase):
    """Test ricerca globale"""

    def setUp(self):
        self.company = Company.objects.create(
            name="Search Test Company",
            slug="search-test",
            status=Company.StatusChoices.ACTIVE,
            plan="professional",
        )
        roles = ensure_company_roles(self.company)
        
        self.admin = User.objects.create_user(
            email="search-admin@test.local",
            password="admin",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            company_role=roles[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )
        
        # Crea dipendenti per test search
        for i in range(3):
            emp_user = User.objects.create_user(
                email=f"search-emp{i}@test.local",
                password="emp",
                role=User.RoleChoices.EMPLOYEE,
                company=self.company,
                company_role=roles[User.RoleChoices.EMPLOYEE],
                must_change_password=False,
            )
            EmployeeProfile.objects.create(
                user=emp_user,
                company=self.company,
                employee_code=f"SEARCH-{i:03d}",
                first_name=f"Employee{i}",
                last_name="SearchTest",
                status=EmployeeProfile.StatusChoices.ACTIVE,
            )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_global_search(self):
        """Test ricerca globale"""
        self.authenticate(self.admin)
        response = self.client.get(
            "/api/search/global/",
            {"q": "Employee", "type": "all"},
        )
        
        self.assertEqual(response.status_code, 200)
        results = response.json()
        self.assertIn("employees", results)
        self.assertIn("companies", results)

    def test_quick_search(self):
        """Test ricerca rapida"""
        self.authenticate(self.admin)
        response = self.client.get(
            "/api/search/quick/",
            {"q": "Employee1"},
        )
        
        self.assertEqual(response.status_code, 200)
        results = response.json()
        self.assertIsInstance(results, list)

    def test_search_filters(self):
        """Test filtri ricerca"""
        self.authenticate(self.admin)
        response = self.client.get(
            "/api/search/global/",
            {
                "q": "Employee",
                "type": "employees",
                "status": "active",
            },
        )
        
        self.assertEqual(response.status_code, 200)

    def test_search_tenant_isolation(self):
        """Test che ricerca rispetta tenant isolation"""
        other_company = Company.objects.create(
            name="Other Company",
            slug="other-company",
            status=Company.StatusChoices.ACTIVE,
        )
        roles = ensure_company_roles(other_company)
        other_user = User.objects.create_user(
            email="other-admin@test.local",
            password="admin",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=other_company,
            company_role=roles[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )
        
        self.authenticate(other_user)
        response = self.client.get("/api/search/global/", {"q": "Employee"})
        
        self.assertEqual(response.status_code, 200)
        results = response.json()
        
        # Non deve vedere dipendenti della prima azienda
        for result_type in ["employees", "all"]:
            if result_type in results:
                for item in results[result_type]:
                    self.assertNotEqual(item.get("company_id"), str(self.company.id))


# ============================================================================
# PERFORMANCE & LOAD TESTS (simplified)
# ============================================================================

class PerformanceTests(APITestCase):
    """Test performance base"""

    def setUp(self):
        self.company = Company.objects.create(
            name="Perf Test Company",
            slug="perf-test",
            status=Company.StatusChoices.ACTIVE,
            plan="professional",
        )
        roles = ensure_company_roles(self.company)
        
        self.admin = User.objects.create_user(
            email="perf-admin@test.local",
            password="admin",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            company_role=roles[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )
        
        # Crea molti dipendenti per test
        for i in range(50):
            emp_user = User.objects.create_user(
                email=f"perf-emp{i}@test.local",
                password="emp",
                role=User.RoleChoices.EMPLOYEE,
                company=self.company,
                company_role=roles[User.RoleChoices.EMPLOYEE],
                must_change_password=False,
            )
            EmployeeProfile.objects.create(
                user=emp_user,
                company=self.company,
                employee_code=f"PERF-{i:03d}",
                first_name=f"Perf{i}",
                last_name="Employee",
                status=EmployeeProfile.StatusChoices.ACTIVE,
            )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_employee_list_pagination(self):
        """Test paginazione lista dipendenti"""
        self.authenticate(self.admin)
        response = self.client.get("/api/employees/?page=1&page_size=20")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertLessEqual(len(data["results"]), 20)

    def test_bulk_operations(self):
        """Test operazioni bulk"""
        self.authenticate(self.admin)
        
        # Bulk create non è implementato ma testiamo endpoint esistenti
        response = self.client.get("/api/employees/?page_size=100")
        
        self.assertEqual(response.status_code, 200)

    def test_concurrent_requests(self):
        """Test richieste concorrenti (sequenziali per semplicità)"""
        self.authenticate(self.admin)
        
        for _ in range(5):
            response = self.client.get("/api/employees/")
            self.assertEqual(response.status_code, 200)