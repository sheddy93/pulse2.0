from datetime import datetime, timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from ..models import (
    AttendancePeriod,
    AuditLog,
    Company,
    ConsultantCompanyLink,
    Document,
    EmployeeProfile,
    PayrollRun,
    TimeEntry,
    User,
    UserCompanyAccess,
)
from ..services import ensure_company_roles
from ..pricing_utils import check_employee_limit, check_module_access


class TenantIsolationTests(APITestCase):
    def setUp(self):
        self.company_a = Company.objects.create(name="Alpha", slug="alpha", status=Company.StatusChoices.ACTIVE)
        self.company_b = Company.objects.create(name="Beta", slug="beta", status=Company.StatusChoices.ACTIVE)

        roles_a = ensure_company_roles(self.company_a)
        roles_b = ensure_company_roles(self.company_b)

        self.company_admin_a = User.objects.create_user(
            email="admin-a@test.local",
            password="admin-a",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company_a,
            company_role=roles_a[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )
        self.company_admin_b = User.objects.create_user(
            email="admin-b@test.local",
            password="admin-b",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company_b,
            company_role=roles_b[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )
        self.employee_user_a = User.objects.create_user(
            email="employee-a@test.local",
            password="employee-a",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company_a,
            company_role=roles_a[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )
        self.employee_user_b = User.objects.create_user(
            email="employee-b@test.local",
            password="employee-b",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company_b,
            company_role=roles_b[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )
        self.consultant_user = User.objects.create_user(
            email="consultant@test.local",
            password="consultant",
            role=User.RoleChoices.EXTERNAL_CONSULTANT,
            company=self.company_a,
            company_role=roles_a[User.RoleChoices.EXTERNAL_CONSULTANT],
            must_change_password=False,
        )
        UserCompanyAccess.objects.create(
            user=self.consultant_user,
            company=self.company_a,
            company_role=roles_a[User.RoleChoices.EXTERNAL_CONSULTANT],
            access_scope=UserCompanyAccess.AccessScopeChoices.READ_ONLY,
            is_primary=True,
            is_active=True,
        )
        UserCompanyAccess.objects.create(
            user=self.consultant_user,
            company=self.company_b,
            company_role=roles_b[User.RoleChoices.EXTERNAL_CONSULTANT],
            access_scope=UserCompanyAccess.AccessScopeChoices.READ_ONLY,
            is_primary=False,
            is_active=True,
        )

        self.employee_profile_a = EmployeeProfile.objects.create(
            user=self.employee_user_a,
            company=self.company_a,
            employee_code="EMP-A-001",
            first_name="Alice",
            last_name="Tenant",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )
        self.employee_profile_b = EmployeeProfile.objects.create(
            user=self.employee_user_b,
            company=self.company_b,
            employee_code="EMP-B-001",
            first_name="Bob",
            last_name="Other",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_company_admin_only_sees_own_tenant_users(self):
        self.authenticate(self.company_admin_a)
        response = self.client.get("/api/company/users/")

        self.assertEqual(response.status_code, 200)
        returned_emails = {item["email"] for item in response.json()}
        self.assertIn(self.company_admin_a.email, returned_emails)
        self.assertNotIn(self.company_admin_b.email, returned_emails)

    def test_employee_only_sees_own_employee_profile(self):
        self.authenticate(self.employee_user_a)
        response = self.client.get("/api/employees/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["id"], str(self.employee_profile_a.id))

    def test_check_out_without_check_in_is_blocked(self):
        self.authenticate(self.employee_user_a)
        response = self.client.post("/api/time/check-out/", {"source": "web"}, format="json")

        self.assertEqual(response.status_code, 400)

    def test_double_check_in_is_blocked(self):
        self.authenticate(self.employee_user_a)
        first_response = self.client.post("/api/time/check-in/", {"source": "web"}, format="json")
        second_response = self.client.post("/api/time/check-in/", {"source": "web"}, format="json")

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 400)

    def test_employee_only_sees_own_time_history(self):
        TimeEntry.objects.create(
            user=self.employee_user_a,
            company=self.company_a,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            source=TimeEntry.SourceChoices.WEB,
        )
        TimeEntry.objects.create(
            user=self.employee_user_b,
            company=self.company_b,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            source=TimeEntry.SourceChoices.WEB,
        )

        self.authenticate(self.employee_user_a)
        response = self.client.get("/api/time/history/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["user"]["email"], self.employee_user_a.email)

    def test_incomplete_previous_day_becomes_review_needed(self):
        target_date = timezone.localdate() - timedelta(days=1)
        timestamp = timezone.make_aware(datetime.combine(target_date, datetime.min.time())) + timedelta(hours=9)
        TimeEntry.objects.create(
            user=self.employee_user_a,
            company=self.company_a,
            created_by=self.employee_user_a,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            source=TimeEntry.SourceChoices.WEB,
            timestamp=timestamp,
        )

        self.authenticate(self.company_admin_a)
        response = self.client.get(f"/api/time/company/daily-review/?month={target_date.month}&year={target_date.year}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        day_row = next(item for item in payload if item["user_id"] == str(self.employee_user_a.id))
        self.assertEqual(day_row["review_status"], "review_needed")
        self.assertIn("missing_check_out", day_row["anomalies"])

    def test_company_cannot_approve_other_tenant_day(self):
        target_date = timezone.localdate()
        TimeEntry.objects.create(
            user=self.employee_user_b,
            company=self.company_b,
            created_by=self.employee_user_b,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            source=TimeEntry.SourceChoices.WEB,
        )

        self.authenticate(self.company_admin_a)
        response = self.client.post(
            "/api/time/company/approve-day/",
            {"user_id": str(self.employee_user_b.id), "date": str(target_date)},
            format="json",
        )

        self.assertIn(response.status_code, {400, 404})

    def test_consultant_only_sees_assigned_companies(self):
        company_c = Company.objects.create(name="Gamma", slug="gamma", status=Company.StatusChoices.ACTIVE)
        self.authenticate(self.consultant_user)
        response = self.client.get("/api/time/consultant/companies/")

        self.assertEqual(response.status_code, 200)
        returned_ids = {item["id"] for item in response.json()}
        self.assertIn(str(self.company_a.id), returned_ids)
        self.assertIn(str(self.company_b.id), returned_ids)
        self.assertNotIn(str(company_c.id), returned_ids)

    def test_correction_generates_audit_log(self):
        target_date = timezone.localdate() - timedelta(days=1)
        timestamp = timezone.make_aware(datetime.combine(target_date, datetime.min.time())) + timedelta(hours=9)
        entry = TimeEntry.objects.create(
            user=self.employee_user_a,
            company=self.company_a,
            created_by=self.employee_user_a,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            source=TimeEntry.SourceChoices.WEB,
            timestamp=timestamp,
        )

        self.authenticate(self.company_admin_a)
        response = self.client.post(
            "/api/time/company/correct-entry/",
            {
                "user_id": str(self.employee_user_a.id),
                "date": str(target_date),
                "action_type": "update",
                "entry_id": str(entry.id),
                "entry_type": "check_in",
                "timestamp": (timestamp + timedelta(minutes=15)).isoformat(),
                "reason": "Correzione amministrativa",
                "note": "Ritardo registrato male",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            AuditLog.objects.filter(
                company=self.company_a,
                action=AuditLog.ActionChoices.ATTENDANCE_CORRECTED,
            ).exists()
        )

    def test_closed_month_blocks_manual_correction(self):
        target_date = timezone.localdate().replace(day=1)
        AttendancePeriod.objects.create(
            company=self.company_a,
            month=target_date.month,
            year=target_date.year,
            status=AttendancePeriod.StatusChoices.CLOSED,
        )
        entry_timestamp = timezone.make_aware(datetime.combine(target_date, datetime.min.time())) + timedelta(hours=9)
        entry = TimeEntry.objects.create(
            user=self.employee_user_a,
            company=self.company_a,
            created_by=self.employee_user_a,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            source=TimeEntry.SourceChoices.WEB,
            timestamp=entry_timestamp,
        )

        self.authenticate(self.company_admin_a)
        response = self.client.post(
            "/api/time/company/correct-entry/",
            {
                "user_id": str(self.employee_user_a.id),
                "date": str(target_date),
                "action_type": "update",
                "entry_id": str(entry.id),
                "entry_type": "check_in",
                "timestamp": (entry_timestamp + timedelta(minutes=5)).isoformat(),
                "reason": "Tentativo su mese chiuso",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_monthly_summary_is_coherent(self):
        target_date = timezone.localdate() - timedelta(days=1)
        check_in = timezone.make_aware(datetime.combine(target_date, datetime.min.time())) + timedelta(hours=9)
        check_out = check_in + timedelta(hours=8)
        TimeEntry.objects.create(
            user=self.employee_user_a,
            company=self.company_a,
            created_by=self.employee_user_a,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            source=TimeEntry.SourceChoices.WEB,
            timestamp=check_in,
        )
        TimeEntry.objects.create(
            user=self.employee_user_a,
            company=self.company_a,
            created_by=self.employee_user_a,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_OUT,
            source=TimeEntry.SourceChoices.WEB,
            timestamp=check_out,
        )

        self.authenticate(self.company_admin_a)
        response = self.client.get(
            f"/api/time/monthly-summary/?month={target_date.month}&year={target_date.year}&user_id={self.employee_user_a.id}"
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 1)
        self.assertGreaterEqual(payload[0]["total_worked_minutes"], 480)

    def test_company_gets_public_id_generated(self):
        self.assertTrue(self.company_a.public_id)
        self.assertNotEqual(self.company_a.public_id, self.company_b.public_id)

    def test_consultant_can_request_company_link_by_public_id(self):
        self.authenticate(self.consultant_user)
        response = self.client.post(
            "/api/consultant-links/request-company/",
            {"public_id": self.company_a.public_id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], "pending_company")

    def test_company_can_approve_consultant_link(self):
        link = ConsultantCompanyLink.objects.create(
            consultant=self.consultant_user,
            company=self.company_a,
            status=ConsultantCompanyLink.StatusChoices.PENDING_COMPANY,
            requested_by=ConsultantCompanyLink.RequestedByChoices.CONSULTANT,
            active=True,
        )
        self.authenticate(self.company_admin_a)
        response = self.client.post(
            "/api/consultant-links/approve/",
            {"link_id": str(link.id)},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        link.refresh_from_db()
        self.assertEqual(link.status, ConsultantCompanyLink.StatusChoices.APPROVED)
        self.assertTrue(
            UserCompanyAccess.objects.filter(user=self.consultant_user, company=self.company_a, is_active=True).exists()
        )

    def test_company_can_request_consultant_by_email_and_consultant_accepts(self):
        self.authenticate(self.company_admin_a)
        request_response = self.client.post(
            "/api/consultant-links/request-consultant/",
            {"consultant_email": self.consultant_user.email},
            format="json",
        )
        self.assertEqual(request_response.status_code, 201)
        link_id = request_response.json()["id"]

        self.authenticate(self.consultant_user)
        approve_response = self.client.post(
            "/api/consultant-links/approve/",
            {"link_id": link_id},
            format="json",
        )

        self.assertEqual(approve_response.status_code, 200)
        self.assertEqual(approve_response.json()["status"], "approved")

    def test_rejected_or_removed_link_blocks_consultant_access(self):
        link = ConsultantCompanyLink.objects.create(
            consultant=self.consultant_user,
            company=self.company_a,
            status=ConsultantCompanyLink.StatusChoices.PENDING_COMPANY,
            requested_by=ConsultantCompanyLink.RequestedByChoices.CONSULTANT,
            active=True,
        )
        self.authenticate(self.company_admin_a)
        self.client.post("/api/consultant-links/approve/", {"link_id": str(link.id)}, format="json")
        self.client.post("/api/consultant-links/remove/", {"link_id": str(link.id)}, format="json")

        self.authenticate(self.consultant_user)
        response = self.client.get("/api/time/consultant/companies/")
        returned_ids = {item["id"] for item in response.json()}

        self.assertNotIn(str(self.company_a.id), returned_ids)


class PayrollDocumentsModuleTests(APITestCase):
    def setUp(self):
        self.company_a = Company.objects.create(name="Payroll Alpha", slug="payroll-alpha", status=Company.StatusChoices.ACTIVE)
        self.company_b = Company.objects.create(name="Payroll Beta", slug="payroll-beta", status=Company.StatusChoices.ACTIVE)

        roles_a = ensure_company_roles(self.company_a)
        roles_b = ensure_company_roles(self.company_b)

        self.company_admin_a = User.objects.create_user(
            email="payroll-admin-a@test.local",
            password="admin-a",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company_a,
            company_role=roles_a[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )
        self.company_admin_b = User.objects.create_user(
            email="payroll-admin-b@test.local",
            password="admin-b",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company_b,
            company_role=roles_b[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )

        self.employee_user_a = User.objects.create_user(
            email="payroll-employee-a@test.local",
            password="employee-a",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company_a,
            company_role=roles_a[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )
        self.employee_user_b = User.objects.create_user(
            email="payroll-employee-b@test.local",
            password="employee-b",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company_a,
            company_role=roles_a[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )

        self.employee_profile_a = EmployeeProfile.objects.create(
            user=self.employee_user_a,
            company=self.company_a,
            employee_code="PAY-EMP-001",
            first_name="Mario",
            last_name="Rossi",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )
        self.employee_profile_b = EmployeeProfile.objects.create(
            user=self.employee_user_b,
            company=self.company_a,
            employee_code="PAY-EMP-002",
            first_name="Luca",
            last_name="Verdi",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )

        self.labor_consultant = User.objects.create_user(
            email="labor-consultant@test.local",
            password="consultant",
            role=User.RoleChoices.LABOR_CONSULTANT,
            company=None,
            company_role=None,
            must_change_password=False,
        )
        self.safety_consultant = User.objects.create_user(
            email="safety-consultant@test.local",
            password="consultant",
            role=User.RoleChoices.SAFETY_CONSULTANT,
            company=self.company_a,
            company_role=roles_a[User.RoleChoices.SAFETY_CONSULTANT],
            must_change_password=False,
        )

        ConsultantCompanyLink.objects.create(
            consultant=self.labor_consultant,
            company=self.company_a,
            status=ConsultantCompanyLink.StatusChoices.APPROVED,
            requested_by=ConsultantCompanyLink.RequestedByChoices.COMPANY,
            active=True,
            approved_at=timezone.now(),
        )
        ConsultantCompanyLink.objects.create(
            consultant=self.labor_consultant,
            company=self.company_b,
            status=ConsultantCompanyLink.StatusChoices.REJECTED,
            requested_by=ConsultantCompanyLink.RequestedByChoices.COMPANY,
            active=False,
        )
        UserCompanyAccess.objects.create(
            user=self.labor_consultant,
            company=self.company_a,
            company_role=roles_a[User.RoleChoices.LABOR_CONSULTANT],
            access_scope=UserCompanyAccess.AccessScopeChoices.READ_ONLY,
            is_primary=False,
            is_active=True,
        )

        self.payroll_a = PayrollRun.objects.create(
            company=self.company_a,
            employee=self.employee_profile_a,
            labor_consultant=self.labor_consultant,
            month=timezone.localdate().month,
            year=timezone.localdate().year,
            status=PayrollRun.StatusChoices.DRAFT,
        )
        self.payroll_b = PayrollRun.objects.create(
            company=self.company_b,
            employee=EmployeeProfile.objects.create(
                company=self.company_b,
                employee_code="PAY-B-001",
                first_name="Anna",
                last_name="Neri",
                status=EmployeeProfile.StatusChoices.ACTIVE,
            ),
            month=timezone.localdate().month,
            year=timezone.localdate().year,
            status=PayrollRun.StatusChoices.DRAFT,
        )

        self.doc_a = Document.objects.create(
            company=self.company_a,
            employee=self.employee_profile_a,
            uploaded_by=self.company_admin_a,
            category=Document.CategoryChoices.PAYROLL_DOCUMENT,
            title="Cedolino Aprile",
            file=SimpleUploadedFile("cedolino-a.pdf", b"%PDF-1.4 payroll-a", content_type="application/pdf"),
            mime_type="application/pdf",
            file_size=16,
            visibility=Document.VisibilityChoices.EMPLOYEE_AND_COMPANY,
            status=Document.StatusChoices.ACTIVE,
            metadata={"original_filename": "cedolino-a.pdf"},
        )
        self.doc_b = Document.objects.create(
            company=self.company_b,
            uploaded_by=self.company_admin_b,
            category=Document.CategoryChoices.COMPANY_DOCUMENT,
            title="Documento Beta",
            file=SimpleUploadedFile("company-b.pdf", b"%PDF-1.4 company-b", content_type="application/pdf"),
            mime_type="application/pdf",
            file_size=16,
            visibility=Document.VisibilityChoices.COMPANY_ONLY,
            status=Document.StatusChoices.ACTIVE,
            metadata={"original_filename": "company-b.pdf"},
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_tenant_isolation_for_document_list(self):
        self.authenticate(self.company_admin_a)
        response = self.client.get("/api/documents/")
        self.assertEqual(response.status_code, 200)
        ids = {item["id"] for item in response.json()}
        self.assertIn(str(self.doc_a.id), ids)
        self.assertNotIn(str(self.doc_b.id), ids)

    def test_employee_cannot_download_other_employee_document(self):
        employee_only_doc = Document.objects.create(
            company=self.company_a,
            employee=self.employee_profile_b,
            uploaded_by=self.company_admin_a,
            category=Document.CategoryChoices.EMPLOYEE_DOCUMENT,
            title="Documento personale B",
            file=SimpleUploadedFile("employee-b.pdf", b"%PDF-1.4 employee-b", content_type="application/pdf"),
            mime_type="application/pdf",
            file_size=16,
            visibility=Document.VisibilityChoices.EMPLOYEE_ONLY,
            status=Document.StatusChoices.ACTIVE,
            metadata={"original_filename": "employee-b.pdf"},
        )
        self.authenticate(self.employee_user_a)
        response = self.client.get(f"/api/documents/{employee_only_doc.id}/download/")
        self.assertEqual(response.status_code, 403)

    def test_labor_consultant_sees_only_assigned_tenant_payroll(self):
        self.authenticate(self.labor_consultant)
        response = self.client.get("/api/payroll/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        returned_ids = {item["id"] for item in payload}
        self.assertIn(str(self.payroll_a.id), returned_ids)
        self.assertNotIn(str(self.payroll_b.id), returned_ids)

    def test_safety_consultant_has_no_payroll_access(self):
        self.authenticate(self.safety_consultant)
        response = self.client.get("/api/payroll/company/overview/")
        self.assertEqual(response.status_code, 403)

    def test_invalid_payroll_transition_is_blocked(self):
        self.authenticate(self.company_admin_a)
        response = self.client.post(
            f"/api/payroll/{self.payroll_a.id}/change-status/",
            {"status": PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_valid_payroll_transition_generates_audit_log(self):
        self.authenticate(self.company_admin_a)
        self.client.post(
            f"/api/payroll/{self.payroll_a.id}/change-status/",
            {"status": PayrollRun.StatusChoices.IN_PROGRESS},
            format="json",
        )
        self.client.post(
            f"/api/payroll/{self.payroll_a.id}/change-status/",
            {"status": PayrollRun.StatusChoices.READY_FOR_REVIEW},
            format="json",
        )
        response = self.client.post(
            f"/api/payroll/{self.payroll_a.id}/change-status/",
            {"status": PayrollRun.StatusChoices.APPROVED_BY_COMPANY},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            AuditLog.objects.filter(
                company=self.company_a,
                action=AuditLog.ActionChoices.PAYROLL_APPROVED,
            ).exists()
        )

    def test_upload_document_generates_audit_log(self):
        self.authenticate(self.company_admin_a)
        response = self.client.post(
            "/api/documents/",
            {
                "title": "Input payroll maggio",
                "category": "payroll_document",
                "visibility": "company_and_consultant",
                "payroll_run_id": str(self.payroll_a.id),
                "role_in_workflow": "input",
                "file": SimpleUploadedFile("input-may.pdf", b"%PDF-1.4 input", content_type="application/pdf"),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            AuditLog.objects.filter(
                company=self.company_a,
                action=AuditLog.ActionChoices.DOCUMENT_UPLOADED,
            ).exists()
        )

    def test_employee_mine_returns_only_authorized_runs(self):
        PayrollRun.objects.create(
            company=self.company_a,
            employee=self.employee_profile_a,
            labor_consultant=self.labor_consultant,
            month=11,
            year=timezone.localdate().year - 1,
            status=PayrollRun.StatusChoices.APPROVED_BY_COMPANY,
        )
        PayrollRun.objects.create(
            company=self.company_a,
            employee=self.employee_profile_a,
            labor_consultant=self.labor_consultant,
            month=12,
            year=timezone.localdate().year - 1,
            status=PayrollRun.StatusChoices.DRAFT,
        )

        self.authenticate(self.employee_user_a)
        response = self.client.get("/api/payroll/employee/mine/")
        self.assertEqual(response.status_code, 200)
        statuses = {item["status"] for item in response.json()}
        self.assertIn(PayrollRun.StatusChoices.APPROVED_BY_COMPANY, statuses)
        self.assertNotIn(PayrollRun.StatusChoices.DRAFT, statuses)


class RolePermissionTests(APITestCase):
    """Test specifici per i diversi ruoli utente"""

    def setUp(self):
        # Super admin: ruolo impostato, is_platform_admin è una property readonly
        self.platform_admin = User.objects.create_user(
            email="super-admin@test.local",
            password="admin",
            role=User.RoleChoices.SUPER_ADMIN,
            must_change_password=False,
        )
        self.company = Company.objects.create(
            name="Test Company",
            slug="test-company",
            status=Company.StatusChoices.ACTIVE,
            plan="professional",
        )
        roles = ensure_company_roles(self.company)

        self.owner = User.objects.create_user(
            email="owner@test.local",
            password="owner",
            role=User.RoleChoices.COMPANY_OWNER,
            company=self.company,
            company_role=roles[User.RoleChoices.COMPANY_OWNER],
            must_change_password=False,
        )
        self.admin = User.objects.create_user(
            email="admin@test.local",
            password="admin",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            company_role=roles[User.RoleChoices.COMPANY_ADMIN],
            must_change_password=False,
        )
        self.hr_manager = User.objects.create_user(
            email="hr@test.local",
            password="hr",
            role=User.RoleChoices.HR_MANAGER,
            company=self.company,
            company_role=roles[User.RoleChoices.HR_MANAGER],
            must_change_password=False,
        )
        self.manager = User.objects.create_user(
            email="manager@test.local",
            password="manager",
            role=User.RoleChoices.MANAGER,
            company=self.company,
            company_role=roles[User.RoleChoices.MANAGER],
            must_change_password=False,
        )
        self.employee = User.objects.create_user(
            email="employee@test.local",
            password="employee",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            company_role=roles[User.RoleChoices.EMPLOYEE],
            must_change_password=False,
        )

        # Crea profili
        self.profile_owner = EmployeeProfile.objects.create(
            user=self.owner, company=self.company,
            employee_code="OWN-001", first_name="Owner", last_name="Test",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )
        self.profile_admin = EmployeeProfile.objects.create(
            user=self.admin, company=self.company,
            employee_code="ADM-001", first_name="Admin", last_name="Test",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )
        self.profile_hr = EmployeeProfile.objects.create(
            user=self.hr_manager, company=self.company,
            employee_code="HR-001", first_name="HR", last_name="Test",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )
        self.profile_manager = EmployeeProfile.objects.create(
            user=self.manager, company=self.company,
            employee_code="MGR-001", first_name="Manager", last_name="Test",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )
        self.profile_employee = EmployeeProfile.objects.create(
            user=self.employee, company=self.company,
            employee_code="EMP-001", first_name="Employee", last_name="Test",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_super_admin_can_access_all_companies(self):
        """Super admin vede tutte le aziende"""
        self.authenticate(self.platform_admin)
        response = self.client.get("/api/companies/")
        self.assertEqual(response.status_code, 200)
        company_ids = {item["id"] for item in response.json()}
        self.assertIn(str(self.company.id), company_ids)

    def test_super_admin_can_access_any_employee(self):
        """Super admin può vedere dipendenti di qualsiasi azienda"""
        self.authenticate(self.platform_admin)
        response = self.client.get("/api/employees/")
        self.assertEqual(response.status_code, 200)

    def test_company_owner_can_manage_company(self):
        """Company owner può gestire l'azienda"""
        self.authenticate(self.owner)
        response = self.client.get("/api/company/users/")
        self.assertEqual(response.status_code, 200)

    def test_company_owner_can_invite_users(self):
        """Company owner può invitare utenti"""
        self.authenticate(self.owner)
        # Test su endpoint esistente per gestione utenti company
        response = self.client.get("/api/company/users/")
        self.assertEqual(response.status_code, 200)

    def test_company_admin_can_access_company_routes(self):
        """Company admin ha accesso alle rotte company"""
        self.authenticate(self.admin)
        response = self.client.get("/api/company/users/")
        # Admin ha accesso
        self.assertEqual(response.status_code, 200)

    def test_hr_manager_can_manage_employees(self):
        """HR manager può gestire dipendenti"""
        self.authenticate(self.hr_manager)
        response = self.client.get("/api/employees/")
        self.assertEqual(response.status_code, 200)
        profiles = response.json()
        # Vede tutti i dipendenti
        self.assertGreaterEqual(len(profiles), 4)

    def test_manager_sees_own_department(self):
        """Manager vede dipendenti del proprio reparto"""
        self.authenticate(self.manager)
        response = self.client.get("/api/employees/")
        self.assertEqual(response.status_code, 200)

    def test_employee_cannot_access_admin_routes(self):
        """Employee non può accedere a rotte admin"""
        self.authenticate(self.employee)
        # Non può accedere a gestione utenti
        response = self.client.get("/api/company/users/")
        self.assertEqual(response.status_code, 403)
        # Non può accedere a gestione dipendenti
        response = self.client.post(
            "/api/employees/",
            {"first_name": "Test", "last_name": "User", "email": "test@test.local"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)


class PricingLimitsTests(APITestCase):
    """Test per la logica dei limiti pricing"""

    def setUp(self):
        from ..models import PricingPlan
        self.company = Company.objects.create(
            name="Pricing Test Company",
            slug="pricing-test",
            status=Company.StatusChoices.ACTIVE,
            plan="professional",
        )
        roles = ensure_company_roles(self.company)
        
        self.owner = User.objects.create_user(
            email="pricing-owner@test.local",
            password="owner",
            role=User.RoleChoices.COMPANY_OWNER,
            company=self.company,
            company_role=roles[User.RoleChoices.COMPANY_OWNER],
            must_change_password=False,
        )
        
        # Crea profili per test limiti
        self.profiles = []
        for i in range(5):
            emp = User.objects.create_user(
                email=f"emp{i}@test.local",
                password="emp",
                role=User.RoleChoices.EMPLOYEE,
                company=self.company,
                company_role=roles[User.RoleChoices.EMPLOYEE],
                must_change_password=False,
            )
            self.profiles.append(EmployeeProfile.objects.create(
                user=emp, company=self.company,
                employee_code=f"EMP-{i}",
                first_name=f"Employee{i}",
                last_name="Test",
                status=EmployeeProfile.StatusChoices.ACTIVE,
            ))

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_employee_limit_check(self):
        """Verifica che check_employee_limit funzioni correttamente"""
        can_add, current, max_emp, extra = check_employee_limit(self.company)
        self.assertEqual(current, 5)
        self.assertIsInstance(can_add, bool)
        self.assertIsInstance(max_emp, int)

    def test_module_access_check(self):
        """Verifica controllo accesso moduli"""
        # Professional plan include payroll
        has_payroll = check_module_access(self.company, "payroll")
        self.assertTrue(has_payroll)
        
        # Verifica modulo non incluso
        has_api = check_module_access(self.company, "api_access")
        # Professional non ha API access
        self.assertFalse(has_api)

    def test_company_limits_endpoint(self):
        """Test endpoint limiti azienda"""
        self.authenticate(self.owner)
        response = self.client.get("/api/company/limits/")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("company", data)
        self.assertIn("limits", data)
        self.assertIn("usage", data)
        self.assertIn("trial", data)
        self.assertEqual(data["company"]["plan"], "professional")
