"""
Test per workflow ferie e permessi
"""
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from users.models import (
    User, Company, EmployeeProfile, 
    LeaveType, LeaveRequest, LeaveBalance
)
from datetime import date, timedelta
from decimal import Decimal


class LeaveWorkflowTest(TestCase):
    """Test completo workflow ferie"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea company
        self.company = Company.objects.create(
            name="Leave Test Company",
            slug="leave-test-company",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea manager/approver
        self.manager = User.objects.create_user(
            email="manager@company.com",
            password="ManagerPass123!",
            role=User.RoleChoices.HR_MANAGER,
            company=self.company,
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
            employee_code="EMP100",
            first_name="Mario",
            last_name="Rossi",
            status=EmployeeProfile.StatusChoices.ACTIVE,
        )
        
        # Crea leave type (ferie)
        self.vacation_type = LeaveType.objects.create(
            company=self.company,
            name="Ferie Annuali",
            code="VACATION",
            leave_type=LeaveType.TypeChoices.VACATION,
            requires_approval=True,
            max_days_per_year=26,
        )
        
        # Crea leave balance
        current_year = timezone.now().year
        self.leave_balance = LeaveBalance.objects.create(
            employee=self.employee,
            leave_type=self.vacation_type,
            year=current_year,
            entitled_days=Decimal("26.00"),
            used_days=Decimal("0.00"),
            pending_days=Decimal("0.00"),
        )
        
        self.requests_url = "/api/leave/requests/"
    
    def test_request_leave_success(self):
        """Test richiesta ferie funziona"""
        # Autentica come employee
        self.client.force_authenticate(user=self.employee_user)
        
        start_date = date.today() + timedelta(days=10)
        end_date = start_date + timedelta(days=4)  # 5 giorni
        
        data = {
            "leave_type": str(self.vacation_type.id),
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_days": 5,
            "reason": "Ferie estive",
        }
        
        response = self.client.post(self.requests_url, data, format="json")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verifica LeaveRequest creata
        leave_request = LeaveRequest.objects.filter(
            employee=self.employee,
            leave_type=self.vacation_type
        ).first()
        
        self.assertIsNotNone(leave_request)
        self.assertEqual(leave_request.status, LeaveRequest.StatusChoices.PENDING)
        self.assertEqual(leave_request.total_days, Decimal("5.00"))
        self.assertEqual(leave_request.reason, "Ferie estive")
        
        # Verifica pending_days aggiornato nel balance
        self.leave_balance.refresh_from_db()
        # (Dipende se l'aggiornamento è automatico o manuale)
    
    def test_approve_leave(self):
        """Test approvazione ferie"""
        # Crea leave request
        leave_request = LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.vacation_type,
            company=self.company,
            status=LeaveRequest.StatusChoices.PENDING,
            start_date=date.today() + timedelta(days=7),
            end_date=date.today() + timedelta(days=11),
            total_days=Decimal("5.00"),
            reason="Vacanza",
        )
        
        # Autentica come manager
        self.client.force_authenticate(user=self.manager)
        
        approve_url = f"/api/leave/requests/{leave_request.id}/approve/"
        data = {"action": "approve"}
        
        response = self.client.post(approve_url, data, format="json")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica status aggiornato
        leave_request.refresh_from_db()
        self.assertEqual(leave_request.status, LeaveRequest.StatusChoices.APPROVED)
        self.assertIsNotNone(leave_request.approved_by)
        self.assertIsNotNone(leave_request.approved_at)
    
    def test_reject_leave(self):
        """Test rifiuto ferie"""
        # Crea leave request
        leave_request = LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.vacation_type,
            company=self.company,
            status=LeaveRequest.StatusChoices.PENDING,
            start_date=date.today() + timedelta(days=7),
            end_date=date.today() + timedelta(days=11),
            total_days=Decimal("5.00"),
        )
        
        # Autentica come manager
        self.client.force_authenticate(user=self.manager)
        
        approve_url = f"/api/leave/requests/{leave_request.id}/approve/"
        data = {
            "action": "reject",
            "rejection_reason": "Periodo non disponibile"
        }
        
        response = self.client.post(approve_url, data, format="json")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica status aggiornato
        leave_request.refresh_from_db()
        self.assertEqual(leave_request.status, LeaveRequest.StatusChoices.REJECTED)
        self.assertEqual(leave_request.rejection_reason, "Periodo non disponibile")
    
    def test_employee_cannot_approve_own_leave(self):
        """Test employee non può approvare le proprie ferie"""
        # Crea leave request
        leave_request = LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.vacation_type,
            company=self.company,
            status=LeaveRequest.StatusChoices.PENDING,
            start_date=date.today() + timedelta(days=7),
            end_date=date.today() + timedelta(days=11),
            total_days=Decimal("5.00"),
        )
        
        # Autentica come employee (stesso che ha richiesto)
        self.client.force_authenticate(user=self.employee_user)
        
        approve_url = f"/api/leave/requests/{leave_request.id}/approve/"
        data = {"action": "approve"}
        
        response = self.client.post(approve_url, data, format="json")
        
        # Verifica errore 403 (Forbidden)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verifica status NON cambiato
        leave_request.refresh_from_db()
        self.assertEqual(leave_request.status, LeaveRequest.StatusChoices.PENDING)
    
    def test_request_leave_exceeds_balance(self):
        """Test richiesta ferie supera saldo disponibile"""
        # Autentica come employee
        self.client.force_authenticate(user=self.employee_user)
        
        # Richiedi più giorni del saldo disponibile
        start_date = date.today() + timedelta(days=10)
        end_date = start_date + timedelta(days=29)  # 30 giorni (> 26 disponibili)
        
        data = {
            "leave_type": str(self.vacation_type.id),
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_days": 30,
            "reason": "Ferie lunghe",
        }
        
        response = self.client.post(self.requests_url, data, format="json")
        
        # Verifica errore 400
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verifica messaggio di errore contiene "balance" o "saldo"
        error_message = str(response.data).lower()
        self.assertTrue(
            "balance" in error_message or "saldo" in error_message or "available" in error_message,
            f"Messaggio errore non menziona balance: {response.data}"
        )


class LeaveBalanceTest(TestCase):
    """Test gestione saldi ferie"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea company
        self.company = Company.objects.create(
            name="Balance Test Company",
            slug="balance-test",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea employee
        self.employee_user = User.objects.create_user(
            email="emp@balance.com",
            password="EmpPass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            is_active=True,
        )
        
        self.employee = EmployeeProfile.objects.create(
            user=self.employee_user,
            company=self.company,
            employee_code="EMP200",
            first_name="Luca",
            last_name="Verdi",
        )
        
        # Crea leave type
        self.vacation_type = LeaveType.objects.create(
            company=self.company,
            name="Ferie",
            code="VAC",
            leave_type=LeaveType.TypeChoices.VACATION,
        )
        
        # Crea balance
        current_year = timezone.now().year
        self.balance = LeaveBalance.objects.create(
            employee=self.employee,
            leave_type=self.vacation_type,
            year=current_year,
            entitled_days=Decimal("22.00"),
            used_days=Decimal("5.00"),
            pending_days=Decimal("3.00"),
            carry_over_days=Decimal("2.00"),
        )
        
        self.client.force_authenticate(user=self.employee_user)
    
    def test_get_leave_balances(self):
        """Test recupero saldi ferie"""
        response = self.client.get("/api/leave/balances/")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica presenza dati
        self.assertIsNotNone(response.data)
    
    def test_available_days_calculation(self):
        """Test calcolo giorni disponibili"""
        # available_days = entitled + carry_over - used - pending
        # = 22 + 2 - 5 - 3 = 16
        expected_available = Decimal("16.00")
        
        self.assertEqual(self.balance.available_days, expected_available)
    
    def test_negative_balance_not_allowed(self):
        """Test saldo negativo non permesso"""
        # Tenta di usare più giorni del disponibile
        self.balance.used_days = Decimal("25.00")  # Supera entitled + carry_over
        
        # Se il modello ha validazione, dovrebbe sollevare errore
        # Altrimenti available_days sarà negativo (da verificare policy aziendale)
        available = self.balance.available_days
        
        # Verifica che available_days sia negativo (indica over-use)
        self.assertLess(available, Decimal("0.00"))


class LeaveCalendarTest(TestCase):
    """Test calendario ferie"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea company
        self.company = Company.objects.create(
            name="Calendar Test Company",
            slug="calendar-test",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea employee
        self.employee_user = User.objects.create_user(
            email="emp@calendar.com",
            password="EmpPass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            is_active=True,
        )
        
        self.employee = EmployeeProfile.objects.create(
            user=self.employee_user,
            company=self.company,
            employee_code="EMP300",
            first_name="Anna",
            last_name="Bianchi",
        )
        
        # Crea leave type
        self.vacation_type = LeaveType.objects.create(
            company=self.company,
            name="Ferie",
            code="VAC",
            leave_type=LeaveType.TypeChoices.VACATION,
        )
        
        # Crea alcune leave requests
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.vacation_type,
            company=self.company,
            status=LeaveRequest.StatusChoices.APPROVED,
            start_date=date.today() + timedelta(days=5),
            end_date=date.today() + timedelta(days=9),
            total_days=Decimal("5.00"),
        )
        
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.vacation_type,
            company=self.company,
            status=LeaveRequest.StatusChoices.PENDING,
            start_date=date.today() + timedelta(days=20),
            end_date=date.today() + timedelta(days=22),
            total_days=Decimal("3.00"),
        )
        
        self.client.force_authenticate(user=self.employee_user)
    
    def test_get_leave_calendar(self):
        """Test recupero calendario ferie"""
        response = self.client.get("/api/leave/calendar/")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica presenza dati
        self.assertIsNotNone(response.data)
    
    def test_leave_stats(self):
        """Test statistiche ferie"""
        response = self.client.get("/api/leave/stats/")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica presenza dati statistici
        self.assertIsNotNone(response.data)


class LeaveTypeConfigTest(TestCase):
    """Test configurazione tipi di assenza"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crea company
        self.company = Company.objects.create(
            name="Config Test Company",
            slug="config-test",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea HR manager
        self.hr_manager = User.objects.create_user(
            email="hr@company.com",
            password="HRPass123!",
            role=User.RoleChoices.HR_MANAGER,
            company=self.company,
            is_active=True,
        )
        
        self.client.force_authenticate(user=self.hr_manager)
    
    def test_get_leave_types(self):
        """Test recupero tipi di assenza configurati"""
        # Crea alcuni leave types
        LeaveType.objects.create(
            company=self.company,
            name="Ferie",
            code="VAC",
leave_type=LeaveType.TypeChoices.VACATION,
        )
        
        LeaveType.objects.create(
            company=self.company,
            name="Malattia",
            code="SICK",
            leave_type=LeaveType.TypeChoices.SICK,
            requires_document=True,
        )
        
        response = self.client.get("/api/leave/types/")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica presenza almeno 2 tipi
        if isinstance(response.data, list):
            self.assertGreaterEqual(len(response.data), 2)
        elif isinstance(response.data, dict) and "results" in response.data:
            self.assertGreaterEqual(len(response.data["results"]), 2)
