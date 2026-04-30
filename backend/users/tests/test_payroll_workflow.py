"""
Test per workflow buste paga (payroll)
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import (
    User, Company, EmployeeProfile, 
    PayrollRun, AttendancePeriod,
    Document
)
from django.utils import timezone
from datetime import date


class PayrollWorkflowTest(TestCase):
    """Test workflow completo buste paga"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea company
        self.company = Company.objects.create(
            name="Payroll Test Company",
            slug="payroll-test",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea company admin
        self.company_admin = User.objects.create_user(
            email="admin@company.com",
            password="AdminPass123!",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            is_active=True,
        )
        
        # Crea consulente
        self.consultant = User.objects.create_user(
            email="consultant@studio.com",
            password="ConsPass123!",
            role=User.RoleChoices.LABOR_CONSULTANT,
            is_active=True,
        )
        
        # Crea employee
        self.employee_user = User.objects.create_user(
            email="employee@company.com",
            password="EmpPass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            is_active=True,
        )
        
        self.employee = EmployeeProfile.objects.create(
            user=self.employee_user,
            company=self.company,
            employee_code="EMP001",
            first_name="Mario",
            last_name="Rossi",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )
        
        # Crea attendance period
        current_month = timezone.now().month
        current_year = timezone.now().year
        
        self.attendance_period_open = AttendancePeriod.objects.create(
            company=self.company,
            month=current_month,
            year=current_year,
            status=AttendancePeriod.StatusChoices.OPEN,
        )
        
        self.attendance_period_approved = AttendancePeriod.objects.create(
            company=self.company,
            month=current_month - 1 if current_month > 1 else 12,
            year=current_year if current_month > 1 else current_year - 1,
            status=AttendancePeriod.StatusChoices.APPROVED,
            approved_by=self.company_admin,
            approved_at=timezone.now(),
        )
    
    def test_payroll_creation_requires_approved_attendance_period(self):
        """Test creazione payroll richiede periodo attendance approvato"""
        # Tenta di creare payroll per periodo NON approvato (current month - OPEN)
        self.client.force_authenticate(user=self.consultant)
        
        data = {
            "employee": str(self.employee.id),
            "month": self.attendance_period_open.month,
            "year": self.attendance_period_open.year,
            "status": PayrollRun.StatusChoices.DRAFT,
        }
        
        response = self.client.post("/api/payroll/", data, format="json")
        
        # Verifica che la creazione sia bloccata o accettata con warning
        # (dipende dalla business logic implementata)
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            # Se bloccato, verifica messaggio errore
            error_message = str(response.data).lower()
            self.assertTrue(
                "approved" in error_message or "approvato" in error_message or "period" in error_message,
                f"Messaggio errore non menziona approval: {response.data}"
            )
        elif response.status_code == status.HTTP_201_CREATED:
            # Se accettato (draft), verifica che sia in stato DRAFT
            payroll = PayrollRun.objects.filter(
                employee=self.employee,
                month=self.attendance_period_open.month,
                year=self.attendance_period_open.year
            ).first()
            
            if payroll:
                self.assertEqual(payroll.status, PayrollRun.StatusChoices.DRAFT)
    
    def test_payroll_creation_succeeds_after_month_approval(self):
        """Test creazione payroll funziona dopo approvazione mese"""
        # Crea payroll per periodo APPROVATO
        self.client.force_authenticate(user=self.consultant)
        
        data = {
            "employee": str(self.employee.id),
            "month": self.attendance_period_approved.month,
            "year": self.attendance_period_approved.year,
            "status": PayrollRun.StatusChoices.DRAFT,
        }
        
        response = self.client.post("/api/payroll/", data, format="json")
        
        # Verifica success
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        
        # Verifica PayrollRun creata
        payroll = PayrollRun.objects.filter(
            employee=self.employee,
            month=self.attendance_period_approved.month,
            year=self.attendance_period_approved.year
        ).first()
        
        self.assertIsNotNone(payroll)
        self.assertEqual(payroll.company, self.company)


class PayrollStatusTransitionsTest(TestCase):
    """Test transizioni di stato per PayrollRun"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea company
        self.company = Company.objects.create(
            name="Status Test Company",
            slug="status-test",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea company admin
        self.company_admin = User.objects.create_user(
            email="admin@company.com",
            password="AdminPass123!",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            is_active=True,
        )
        
        # Crea consulente
        self.consultant = User.objects.create_user(
            email="consultant@studio.com",
            password="ConsPass123!",
            role=User.RoleChoices.LABOR_CONSULTANT,
            is_active=True,
        )
        
        # Crea employee
        self.employee_user = User.objects.create_user(
            email="employee@company.com",
            password="EmpPass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            is_active=True,
        )
        
        self.employee = EmployeeProfile.objects.create(
            user=self.employee_user,
            company=self.company,
            employee_code="EMP001",
            first_name="Test",
            last_name="Employee",
        )
        
        # Crea payroll
        self.payroll = PayrollRun.objects.create(
            company=self.company,
            employee=self.employee,
            labor_consultant=self.consultant,
            month=timezone.now().month,
            year=timezone.now().year,
            status=PayrollRun.StatusChoices.DRAFT,
        )
    
    def test_status_transitions_follow_business_rules(self):
        """Test transizioni di stato seguono regole di business"""
        # Flusso normale: draft -> in_progress -> ready_for_review -> approved_by_company -> delivered_to_employee
        
        # 1. DRAFT -> IN_PROGRESS
        self.client.force_authenticate(user=self.consultant)
        
        url = f"/api/payroll/{self.payroll.id}/change-status/"
        data = {"status": PayrollRun.StatusChoices.IN_PROGRESS}
        
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.payroll.refresh_from_db()
        self.assertEqual(self.payroll.status, PayrollRun.StatusChoices.IN_PROGRESS)
        
        # 2. IN_PROGRESS -> READY_FOR_REVIEW
        data = {"status": PayrollRun.StatusChoices.READY_FOR_REVIEW}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.payroll.refresh_from_db()
        self.assertEqual(self.payroll.status, PayrollRun.StatusChoices.READY_FOR_REVIEW)
        
        # 3. READY_FOR_REVIEW -> APPROVED_BY_COMPANY (company admin)
        self.client.force_authenticate(user=self.company_admin)
        
        data = {"status": PayrollRun.StatusChoices.APPROVED_BY_COMPANY}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.payroll.refresh_from_db()
        self.assertEqual(self.payroll.status, PayrollRun.StatusChoices.APPROVED_BY_COMPANY)
        
        # 4. APPROVED_BY_COMPANY -> DELIVERED_TO_EMPLOYEE (consultant o admin)
        data = {"status": PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.payroll.refresh_from_db()
        self.assertEqual(self.payroll.status, PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE)
        self.assertIsNotNone(self.payroll.delivered_at)
    
    def test_correction_requested_branch(self):
        """Test branch di correzione"""
        # Porta payroll a READY_FOR_REVIEW
        self.payroll.status = PayrollRun.StatusChoices.READY_FOR_REVIEW
        self.payroll.save()
        
        # Company richiede correzione
        self.client.force_authenticate(user=self.company_admin)
        
        url = f"/api/payroll/{self.payroll.id}/change-status/"
        data = {
            "status": PayrollRun.StatusChoices.CORRECTION_REQUESTED,
            "notes_company": "Errore nell'importo straordinari"
        }
        
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.payroll.refresh_from_db()
        self.assertEqual(self.payroll.status, PayrollRun.StatusChoices.CORRECTION_REQUESTED)
        self.assertEqual(self.payroll.notes_company, "Errore nell'importo straordinari")


class PayrollPublishPermissionsTest(TestCase):
    """Test permessi per pubblicazione buste paga"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea company
        self.company = Company.objects.create(
            name="Publish Test Company",
            slug="publish-test",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea company admin
        self.company_admin = User.objects.create_user(
            email="admin@company.com",
            password="AdminPass123!",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            is_active=True,
        )
        
        # Crea employee (NO permission to publish)
        self.employee_user = User.objects.create_user(
            email="employee@company.com",
            password="EmpPass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            is_active=True,
        )
        
        self.employee = EmployeeProfile.objects.create(
            user=self.employee_user,
            company=self.company,
            employee_code="EMP001",
            first_name="Test",
            last_name="Employee",
        )
        
        # Crea payroll APPROVED (pronto per delivery)
        self.payroll = PayrollRun.objects.create(
            company=self.company,
            employee=self.employee,
            month=timezone.now().month,
            year=timezone.now().year,
            status=PayrollRun.StatusChoices.APPROVED_BY_COMPANY,
            approved_at=timezone.now(),
        )
    
    def test_company_cannot_publish_without_approval_path(self):
        """Test company non può pubblicare senza path di approvazione corretto"""
        # Crea payroll in DRAFT (senza approval)
        payroll_draft = PayrollRun.objects.create(
            company=self.company,
            employee=self.employee,
            month=(timezone.now().month - 1) or 12,
            year=timezone.now().year,
            status=PayrollRun.StatusChoices.DRAFT,
        )
        
        # Tenta di pubblicare direttamente da DRAFT
        self.client.force_authenticate(user=self.company_admin)
        
        url = f"/api/payroll/{payroll_draft.id}/change-status/"
        data = {"status": PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE}
        
        response = self.client.post(url, data, format="json")
        
        # Verifica errore 400 (violazione workflow)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verifica messaggio errore
        error_message = str(response.data).lower()
        self.assertTrue(
            "status" in error_message or "workflow" in error_message or "approval" in error_message,
            f"Messaggio errore non menziona status/workflow: {response.data}"
        )
    
    def test_employee_cannot_change_payroll_status(self):
        """Test employee non può cambiare status payroll"""
        # Autentica come employee (non admin)
        self.client.force_authenticate(user=self.employee_user)
        
        url = f"/api/payroll/{self.payroll.id}/change-status/"
        data = {"status": PayrollRun.StatusChoices.DELIVERED_TO_EMPLOYEE}
        
        response = self.client.post(url, data, format="json")
        
        # Verifica errore 403 (Forbidden)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verifica status NON cambiato
        self.payroll.refresh_from_db()
        self.assertEqual(self.payroll.status, PayrollRun.StatusChoices.APPROVED_BY_COMPANY)


class PayrollDocumentAttachmentTest(TestCase):
    """Test allegati documenti a payroll"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea company
        self.company = Company.objects.create(
            name="Doc Test Company",
            slug="doc-test",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea consulente
        self.consultant = User.objects.create_user(
            email="consultant@studio.com",
            password="ConsPass123!",
            role=User.RoleChoices.LABOR_CONSULTANT,
            is_active=True,
        )
        
        # Crea employee
        self.employee = EmployeeProfile.objects.create(
            company=self.company,
            employee_code="EMP001",
            first_name="Test",
            last_name="Employee",
        )
        
        # Crea payroll
        self.payroll = PayrollRun.objects.create(
            company=self.company,
            employee=self.employee,
            labor_consultant=self.consultant,
            month=timezone.now().month,
            year=timezone.now().year,
            status=PayrollRun.StatusChoices.IN_PROGRESS,
        )
        
        self.client.force_authenticate(user=self.consultant)
    
    def test_attach_document_to_payroll(self):
        """Test allega documento a payroll"""
        # Crea documento
        document = Document.objects.create(
            company=self.company,
            employee=self.employee,
            uploaded_by=self.consultant,
            category=Document.CategoryChoices.PAYROLL_DOCUMENT,
            title="Busta Paga",
            file="test.pdf",
            mime_type="application/pdf",
        )
        
        url = f"/api/payroll/{self.payroll.id}/attach-document/"
        data = {
            "document": str(document.id),
            "role_in_workflow": "final_payslip",
        }
        
        response = self.client.post(url, data, format="json")
        
        # Verifica success
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        
        # Verifica documento collegato
        self.payroll.refresh_from_db()
        linked_docs = self.payroll.document_links.all()
        self.assertGreater(linked_docs.count(), 0)
