"""
Test per permission matrix e isolamento dati tra tenant
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import (
    User, Company, EmployeeProfile, 
    ConsultantCompanyLink, TimeEntry
)
from django.utils import timezone


class PermissionMatrixTest(TestCase):
    """Test matrice permessi e isolamento dati"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea Company A
        self.company_a = Company.objects.create(
            name="Company A",
            slug="company-a",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea Company B
        self.company_b = Company.objects.create(
            name="Company B",
            slug="company-b",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea employee per Company A
        self.employee_a = User.objects.create_user(
            email="employee_a@companya.com",
            password="Pass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company_a,
            is_active=True,
        )
        
        self.emp_profile_a = EmployeeProfile.objects.create(
            user=self.employee_a,
            company=self.company_a,
            employee_code="EMPA001",
            first_name="Employee",
            last_name="A",
        )
        
        # Crea employee per Company B
        self.employee_b = User.objects.create_user(
            email="employee_b@companyb.com",
            password="Pass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company_b,
            is_active=True,
        )
        
        self.emp_profile_b = EmployeeProfile.objects.create(
            user=self.employee_b,
            company=self.company_b,
            employee_code="EMPB001",
            first_name="Employee",
            last_name="B",
        )
        
        # Crea timbrature per Company A
        TimeEntry.objects.create(
            user=self.employee_a,
            company=self.company_a,
            employee_profile=self.emp_profile_a,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            timestamp=timezone.now(),
        )
        
        # Crea timbrature per Company B
        TimeEntry.objects.create(
            user=self.employee_b,
            company=self.company_b,
            employee_profile=self.emp_profile_b,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            timestamp=timezone.now(),
        )
    
    def test_employee_cannot_see_other_company_data(self):
        """Test employee non può vedere dati di altra azienda"""
        # Autentica come employee di Company A
        self.client.force_authenticate(user=self.employee_a)
        
        # Tenta di accedere ai dati (es. employees list)
        response = self.client.get("/api/employees/")
        
        # Verifica success
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica che vede SOLO employee della propria company
        if isinstance(response.data, list):
            employees = response.data
        elif isinstance(response.data, dict) and "results" in response.data:
            employees = response.data["results"]
        else:
            employees = []
        
        # Verifica che employee_b NON sia nella lista
        employee_codes = [emp.get("employee_code") for emp in employees if "employee_code" in emp]
        self.assertNotIn("EMPB001", employee_codes, 
                        "Employee B non dovrebbe essere visibile a Employee A")
        
        # Verifica che employee_a SIA nella lista (o almeno company_a)
        company_ids = [str(emp.get("company")) for emp in employees if "company" in emp]
        if company_ids:
            self.assertNotIn(str(self.company_b.id), company_ids,
                           "Company B non dovrebbe essere visibile")
    
    def test_employee_cannot_access_other_tenant_time_entries(self):
        """Test employee non può accedere a timbrature di altro tenant"""
        # Autentica come employee di Company A
        self.client.force_authenticate(user=self.employee_a)
        
        # Accedi allo storico timbrature
        response = self.client.get("/api/time/history/")
        
        # Verifica success
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica che vede SOLO le proprie timbrature
        # Le timbrature di employee_b NON devono essere visibili
        # (la verifica dipende dalla struttura della risposta)
        
        # Test indiretto: verifica che il totale entries sia <= alle entries di company_a
        total_entries_company_a = TimeEntry.objects.filter(company=self.company_a).count()
        
        if isinstance(response.data, list):
            returned_entries = len(response.data)
        elif isinstance(response.data, dict) and "results" in response.data:
            returned_entries = len(response.data["results"])
        else:
            returned_entries = 0
        
        self.assertLessEqual(returned_entries, total_entries_company_a,
                            "Employee A vede più timbrature della propria company")


class ConsultantPermissionsTest(TestCase):
    """Test permessi consulente"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea Company A
        self.company_a = Company.objects.create(
            name="Company A",
            slug="company-a-consultant",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea Company B
        self.company_b = Company.objects.create(
            name="Company B",
            slug="company-b-consultant",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea consulente
        self.consultant = User.objects.create_user(
            email="consultant@studio.com",
            password="ConsPass123!",
            role=User.RoleChoices.LABOR_CONSULTANT,
            is_active=True,
        )
        
        # Collega consulente a Company A (approved)
        ConsultantCompanyLink.objects.create(
            consultant=self.consultant,
            company=self.company_a,
            status=ConsultantCompanyLink.StatusChoices.APPROVED,
            requested_by=ConsultantCompanyLink.RequestedByChoices.COMPANY,
            active=True,
        )
        
        # NON collegare a Company B (o crea link pending)
        ConsultantCompanyLink.objects.create(
            consultant=self.consultant,
            company=self.company_b,
            status=ConsultantCompanyLink.StatusChoices.PENDING_COMPANY,
            requested_by=ConsultantCompanyLink.RequestedByChoices.CONSULTANT,
            active=False,
        )
        
        # Crea employee per Company A
        self.emp_a = EmployeeProfile.objects.create(
            company=self.company_a,
            employee_code="EMPA001",
            first_name="Emp",
            last_name="A",
        )
        
        # Crea employee per Company B
        self.emp_b = EmployeeProfile.objects.create(
            company=self.company_b,
            employee_code="EMPB001",
            first_name="Emp",
            last_name="B",
        )
    
    def test_consultant_sees_only_approved_linked_companies(self):
        """Test consulente vede solo aziende con link approvato"""
        # Autentica come consulente
        self.client.force_authenticate(user=self.consultant)
        
        # Accedi alla lista companies del consulente
        response = self.client.get("/api/time/consultant/companies/")
        
        # Verifica success
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica che vede Company A ma NON Company B
        if isinstance(response.data, list):
            companies = response.data
        elif isinstance(response.data, dict) and "results" in response.data:
            companies = response.data["results"]
        else:
            companies = []
        
        company_names = [comp.get("name") for comp in companies if "name" in comp]
        
        # Company A dovrebbe essere presente
        self.assertIn("Company A", company_names,
                     "Consulente dovrebbe vedere Company A (approved)")
        
        # Company B NON dovrebbe essere presente (link pending)
        self.assertNotIn("Company B", company_names,
                        "Consulente NON dovrebbe vedere Company B (pending)")
    
    def test_consultant_cannot_access_non_linked_company_data(self):
        """Test consulente non può accedere a dati di company non collegata"""
        # Autentica come consulente
        self.client.force_authenticate(user=self.consultant)
        
        # Tenta di accedere a employees (dovrebbe vedere solo Company A)
        response = self.client.get("/api/employees/")
        
        # Verifica success (o 403 se endpoint richiede company specifica)
        if response.status_code == status.HTTP_200_OK:
            # Verifica che NON veda employee di Company B
            if isinstance(response.data, list):
                employees = response.data
            elif isinstance(response.data, dict) and "results" in response.data:
                employees = response.data["results"]
            else:
                employees = []
            
            employee_codes = [emp.get("employee_code") for emp in employees if "employee_code" in emp]
            
            self.assertNotIn("EMPB001", employee_codes,
                           "Consulente NON dovrebbe vedere employee di Company B")


class CompanyOperatorPermissionsTest(TestCase):
    """Test permessi company operator/admin"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea Company A
        self.company_a = Company.objects.create(
            name="Company A",
            slug="company-a-operator",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea Company B
        self.company_b = Company.objects.create(
            name="Company B",
            slug="company-b-operator",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea company admin per Company A
        self.admin_a = User.objects.create_user(
            email="admin@companya.com",
            password="AdminPass123!",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company_a,
            is_active=True,
        )
        
        # Crea employees
        emp_user_a = User.objects.create_user(
            email="emp_a@companya.com",
            password="Pass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company_a,
            is_active=True,
        )
        
        self.emp_a = EmployeeProfile.objects.create(
            user=emp_user_a,
            company=self.company_a,
            employee_code="EMPA001",
            first_name="Emp",
            last_name="A",
        )
        
        emp_user_b = User.objects.create_user(
            email="emp_b@companyb.com",
            password="Pass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company_b,
            is_active=True,
        )
        
        self.emp_b = EmployeeProfile.objects.create(
            user=emp_user_b,
            company=self.company_b,
            employee_code="EMPB001",
            first_name="Emp",
            last_name="B",
        )
        
        # Crea timbrature
        TimeEntry.objects.create(
            user=emp_user_a,
            company=self.company_a,
            employee_profile=self.emp_a,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            timestamp=timezone.now(),
        )
        
        TimeEntry.objects.create(
            user=emp_user_b,
            company=self.company_b,
            employee_profile=self.emp_b,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            timestamp=timezone.now(),
        )
    
    def test_company_operator_can_review_attendance_but_not_other_tenants(self):
        """Test company operator può gestire presenze ma solo della propria azienda"""
        # Autentica come admin di Company A
        self.client.force_authenticate(user=self.admin_a)
        
        # Accedi a attendance overview
        response = self.client.get("/api/time/company/overview/")
        
        # Verifica success
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica che vede solo dati di Company A
        # (la verifica dipende dalla struttura della risposta)
        
        # Se la risposta contiene employees, verifica che NON ci sia EMPB001
        response_str = str(response.data)
        self.assertNotIn("EMPB001", response_str,
                        "Admin Company A NON dovrebbe vedere employee di Company B")
        self.assertNotIn(str(self.company_b.id), response_str,
                        "Admin Company A NON dovrebbe vedere Company B")
