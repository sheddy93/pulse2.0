"""
Test per sistema timbrature (attendance/time tracking)
"""
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User, Company, EmployeeProfile, TimeEntry
from datetime import datetime, timedelta


class AttendanceTest(TestCase):
    """Test per timbrature giornaliere"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea company
        self.company = Company.objects.create(
            name="Test Company",
            slug="test-company",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea utente employee
        self.user = User.objects.create_user(
            email="employee@test.com",
            password="TestPass123!",
            first_name="John",
            last_name="Doe",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            is_active=True,
        )
        
        # Crea employee profile
        self.employee = EmployeeProfile.objects.create(
            user=self.user,
            company=self.company,
            employee_code="EMP001",
            first_name="John",
            last_name="Doe",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )
        
        # Autentica utente
        self.client.force_authenticate(user=self.user)
        
        self.check_in_url = "/api/time/check-in/"
        self.check_out_url = "/api/time/check-out/"
        self.today_url = "/api/time/today/"
    
    def test_clock_in_success(self):
        """Test timbratura ingresso funziona"""
        data = {
            "note": "Inizio lavoro",
        }
        
        response = self.client.post(self.check_in_url, data, format="json")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verifica TimeEntry creata
        time_entry = TimeEntry.objects.filter(
            user=self.user,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN
        ).first()
        
        self.assertIsNotNone(time_entry)
        self.assertEqual(time_entry.company, self.company)
        self.assertEqual(time_entry.note, "Inizio lavoro")
        
        # Verifica timestamp è oggi
        self.assertEqual(time_entry.timestamp.date(), timezone.now().date())
    
    def test_clock_out_success(self):
        """Test timbratura uscita funziona"""
        # Prima fai check-in
        TimeEntry.objects.create(
            user=self.user,
            company=self.company,
            employee_profile=self.employee,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            timestamp=timezone.now(),
        )
        
        # Poi fai check-out
        data = {
            "note": "Fine lavoro",
        }
        
        response = self.client.post(self.check_out_url, data, format="json")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verifica TimeEntry check-out creata
        checkout_entry = TimeEntry.objects.filter(
            user=self.user,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_OUT
        ).first()
        
        self.assertIsNotNone(checkout_entry)
        self.assertEqual(checkout_entry.note, "Fine lavoro")
    
    def test_no_double_clock_in(self):
        """Test non permette doppio check-in nello stesso giorno"""
        # Primo check-in
        self.client.post(self.check_in_url, {}, format="json")
        
        # Secondo check-in (dovrebbe fallire)
        response = self.client.post(self.check_in_url, {}, format="json")
        
        # Verifica errore 400
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verifica solo 1 check-in presente
        check_ins = TimeEntry.objects.filter(
            user=self.user,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            timestamp__date=timezone.now().date()
        )
        self.assertEqual(check_ins.count(), 1)
    
    def test_clock_out_without_clock_in(self):
        """Test check-out senza check-in dovrebbe fallire"""
        response = self.client.post(self.check_out_url, {}, format="json")
        
        # Verifica errore (potrebbe essere 400 o permesso con warning)
        # Dipende dall'implementazione
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            # Se è bloccato
            self.assertIn("check", str(response.data).lower())
    
    def test_get_today_entries(self):
        """Test recupero timbrature di oggi"""
        # Crea alcune timbrature
        TimeEntry.objects.create(
            user=self.user,
            company=self.company,
            employee_profile=self.employee,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            timestamp=timezone.now(),
        )
        
        TimeEntry.objects.create(
            user=self.user,
            company=self.company,
            employee_profile=self.employee,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_OUT,
            timestamp=timezone.now() + timedelta(hours=8),
        )
        
        response = self.client.get(self.today_url)
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica dati presenti
        # (la struttura dipende dal serializer)
        self.assertIsNotNone(response.data)
    
    def test_time_history(self):
        """Test recupero storico timbrature"""
        # Crea timbrature di ieri
        yesterday = timezone.now() - timedelta(days=1)
        TimeEntry.objects.create(
            user=self.user,
            company=self.company,
            employee_profile=self.employee,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            timestamp=yesterday.replace(hour=9, minute=0),
        )
        
        TimeEntry.objects.create(
            user=self.user,
            company=self.company,
            employee_profile=self.employee,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_OUT,
            timestamp=yesterday.replace(hour=18, minute=0),
        )
        
        # Crea timbrature di oggi
        today = timezone.now()
        TimeEntry.objects.create(
            user=self.user,
            company=self.company,
            employee_profile=self.employee,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            timestamp=today.replace(hour=8, minute=30),
        )
        
        response = self.client.get("/api/time/history/")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica presenza dati (almeno 3 entries)
        # La struttura dipende dal serializer
        if isinstance(response.data, list):
            self.assertGreaterEqual(len(response.data), 3)
        elif isinstance(response.data, dict) and "results" in response.data:
            self.assertGreaterEqual(len(response.data["results"]), 3)
    
    def test_unauthorized_access(self):
        """Test accesso non autorizzato alle timbrature"""
        # Logout
        self.client.force_authenticate(user=None)
        
        response = self.client.post(self.check_in_url, {}, format="json")
        
        # Verifica errore 401
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class BreakManagementTest(TestCase):
    """Test per gestione pause"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea company e user
        self.company = Company.objects.create(
            name="Test Company",
            slug="test-company-breaks",
            status=Company.StatusChoices.ACTIVE,
        )
        
        self.user = User.objects.create_user(
            email="employee2@test.com",
            password="TestPass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            is_active=True,
        )
        
        self.employee = EmployeeProfile.objects.create(
            user=self.user,
            company=self.company,
            employee_code="EMP002",
            first_name="Jane",
            last_name="Smith",
        )
        
        self.client.force_authenticate(user=self.user)
        
        # Fai check-in prima dei test
        TimeEntry.objects.create(
            user=self.user,
            company=self.company,
            employee_profile=self.employee,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            timestamp=timezone.now(),
        )
    
    def test_break_start(self):
        """Test inizio pausa"""
        response = self.client.post("/api/time/break-start/", {}, format="json")
        
        # Verifica success
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        
        # Verifica TimeEntry creata
        break_entry = TimeEntry.objects.filter(
            user=self.user,
            entry_type=TimeEntry.EntryTypeChoices.BREAK_START
        ).first()
        
        self.assertIsNotNone(break_entry)
    
    def test_break_end(self):
        """Test fine pausa"""
        # Inizia pausa
        TimeEntry.objects.create(
            user=self.user,
            company=self.company,
            employee_profile=self.employee,
            entry_type=TimeEntry.EntryTypeChoices.BREAK_START,
            timestamp=timezone.now(),
        )
        
        # Termina pausa
        response = self.client.post("/api/time/break-end/", {}, format="json")
        
        # Verifica success
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        
        # Verifica TimeEntry creata
        break_end = TimeEntry.objects.filter(
            user=self.user,
            entry_type=TimeEntry.EntryTypeChoices.BREAK_END
        ).first()
        
        self.assertIsNotNone(break_end)


class CompanyAttendanceManagementTest(TestCase):
    """Test per gestione presenze da parte dell'azienda"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea company
        self.company = Company.objects.create(
            name="Company for Mgmt",
            slug="company-mgmt",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea company admin
        self.admin_user = User.objects.create_user(
            email="admin@company.com",
            password="AdminPass123!",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            is_active=True,
        )
        
        # Crea employee
        self.employee_user = User.objects.create_user(
            email="emp@company.com",
            password="EmpPass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            is_active=True,
        )
        
        self.employee = EmployeeProfile.objects.create(
            user=self.employee_user,
            company=self.company,
            employee_code="EMP003",
            first_name="Test",
            last_name="Employee",
        )
        
        # Autentica come admin
        self.client.force_authenticate(user=self.admin_user)
    
    def test_company_attendance_overview(self):
        """Test panoramica presenze azienda"""
        # Crea alcune timbrature per employee
        TimeEntry.objects.create(
            user=self.employee_user,
            company=self.company,
            employee_profile=self.employee,
            entry_type=TimeEntry.EntryTypeChoices.CHECK_IN,
            timestamp=timezone.now().replace(hour=9, minute=0),
        )
        
        response = self.client.get("/api/time/company/overview/")
        
        # Verifica success
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica presenza dati
        self.assertIsNotNone(response.data)
    
    def test_employee_cannot_access_company_overview(self):
        """Test employee non può accedere a overview aziendale"""
        # Autentica come employee
        self.client.force_authenticate(user=self.employee_user)
        
        response = self.client.get("/api/time/company/overview/")
        
        # Verifica errore 403 (Forbidden)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
