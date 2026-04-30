"""
Test per automazioni e notifiche
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from users.models import (
    User, Company, EmployeeProfile, 
    AutomationRule, Notification, Task,
    TimeEntry, LeaveRequest, LeaveType,
    Document
)
from users.automation_service import AutomationService


class AutomationServiceTest(TestCase):
    """Test servizio automazioni"""
    
    def setUp(self):
        # Crea company
        self.company = Company.objects.create(
            name="Test Company",
            slug="test-company-automation",
            status=Company.StatusChoices.ACTIVE,
        )
        
        # Crea utente admin
        self.admin = User.objects.create_user(
            email="admin@testcompany.com",
            password="AdminPass123!",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            is_active=True,
        )
        
        # Crea employee
        self.employee_user = User.objects.create_user(
            email="employee@testcompany.com",
            password="EmpPass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            is_active=True,
        )
        
        self.employee = EmployeeProfile.objects.create(
            user=self.employee_user,
            company=self.company,
            employee_code="EMP001",
            first_name="John",
            last_name="Doe",
        )
    
    def test_missing_clock_in_automation(self):
        """Test automazione per timbratura mancante"""
        # Crea rule
        rule = AutomationRule.objects.create(
            company=self.company,
            name="Check timbrata mancante",
            trigger_type=AutomationRule.TriggerType.MISSING_CLOCK_IN,
            conditions={"hours": 10},
            action_type=AutomationRule.ActionType.CREATE_NOTIFICATION,
            is_active=True,
        )
        
        # Simula che sia oltre le 10:00 e non ci siano timbrature
        # (il test effettivo dipende dall'orario corrente)
        
        # Esegui automazione
        initial_notifications = Notification.objects.filter(user=self.employee_user).count()
        
        result = AutomationService.run_missing_clock_in_check(self.company)
        
        # Se siamo oltre le 10:00 e non ci sono timbrature, dovrebbe creare notifica
        current_hour = timezone.now().hour
        if current_hour >= 10:
            # Verifica che sia stata creata una notifica
            final_notifications = Notification.objects.filter(user=self.employee_user).count()
            self.assertGreater(final_notifications, initial_notifications,
                             "Dovrebbe essere stata creata una notifica per timbratura mancante")
            
            # Verifica contenuto notifica
            latest_notif = Notification.objects.filter(user=self.employee_user).order_by('-created_at').first()
            self.assertIsNotNone(latest_notif)
            self.assertIn("timbrat", latest_notif.message.lower())
            self.assertEqual(latest_notif.notification_type, Notification.TypeChoices.WARNING)
    
    def test_pending_leave_automation(self):
        """Test automazione per ferie pending troppo a lungo"""
        # Crea leave type
        leave_type = LeaveType.objects.create(
            company=self.company,
            name="Ferie",
            code="VAC",
            requires_approval=True,
        )
        
        # Crea richiesta ferie pending da 3 giorni
        old_date = timezone.now() - timedelta(days=3)
        leave = LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=leave_type,
            status=LeaveRequest.StatusChoices.PENDING,
            start_date=timezone.now().date() + timedelta(days=10),
            end_date=timezone.now().date() + timedelta(days=12),
            total_days=3,
            company=self.company,
        )
        
        # Backdating created_at
        LeaveRequest.objects.filter(id=leave.id).update(created_at=old_date)
        
        # Esegui automazione
        initial_notifications = Notification.objects.filter(user=self.admin).count()
        
        result = AutomationService.run_pending_leave_check(self.company)
        
        # Verifica che sia stata creata notifica per admin
        final_notifications = Notification.objects.filter(user=self.admin).count()
        self.assertGreater(final_notifications, initial_notifications,
                         "Dovrebbe essere stata creata notifica per ferie pending")
        
        # Verifica contenuto
        latest_notif = Notification.objects.filter(user=self.admin).order_by('-created_at').first()
        self.assertIsNotNone(latest_notif)
        self.assertIn("ferie", latest_notif.message.lower())
    
    def test_automation_rule_execution(self):
        """Test esecuzione generale di una automation rule"""
        # Crea rule attiva
        rule = AutomationRule.objects.create(
            company=self.company,
            name="Test Rule",
            trigger_type=AutomationRule.TriggerType.MISSING_CLOCK_IN,
            action_type=AutomationRule.ActionType.CREATE_NOTIFICATION,
            is_active=True,
        )
        
        # Verifica che last_run_at sia None
        self.assertIsNone(rule.last_run_at)
        
        # Esegui automazione
        AutomationService.execute_automation(rule)
        
        # Ricarica rule
        rule.refresh_from_db()
        
        # Verifica che last_run_at sia stato aggiornato
        self.assertIsNotNone(rule.last_run_at)
    
    def test_inactive_automation_not_executed(self):
        """Test che automazioni disattivate non vengano eseguite"""
        # Crea rule inattiva
        rule = AutomationRule.objects.create(
            company=self.company,
            name="Inactive Rule",
            trigger_type=AutomationRule.TriggerType.MISSING_CLOCK_IN,
            action_type=AutomationRule.ActionType.CREATE_NOTIFICATION,
            is_active=False,  # Disattivata
        )
        
        initial_notifications = Notification.objects.count()
        
        # Esegui automazione
        result = AutomationService.execute_automation(rule)
        
        # Verifica che non sia stata creata alcuna notifica
        final_notifications = Notification.objects.count()
        self.assertEqual(final_notifications, initial_notifications,
                        "Automazione inattiva non dovrebbe generare notifiche")
    
    def test_run_all_company_automations(self):
        """Test esecuzione di tutte le automazioni di un'azienda"""
        # Crea multiple rules
        rule1 = AutomationRule.objects.create(
            company=self.company,
            name="Rule 1",
            trigger_type=AutomationRule.TriggerType.MISSING_CLOCK_IN,
            action_type=AutomationRule.ActionType.CREATE_NOTIFICATION,
            is_active=True,
        )
        
        rule2 = AutomationRule.objects.create(
            company=self.company,
            name="Rule 2",
            trigger_type=AutomationRule.TriggerType.LEAVE_PENDING_LONG,
            action_type=AutomationRule.ActionType.CREATE_NOTIFICATION,
            is_active=True,
        )
        
        rule3 = AutomationRule.objects.create(
            company=self.company,
            name="Rule 3 Inactive",
            trigger_type=AutomationRule.TriggerType.DOCUMENT_EXPIRING,
            action_type=AutomationRule.ActionType.CREATE_NOTIFICATION,
            is_active=False,  # Inattiva
        )
        
        # Esegui tutte le automazioni
        results = AutomationService.run_company_automations(self.company)
        
        # Verifica che siano state eseguite solo le attive
        self.assertIn("Rule 1", results)
        self.assertIn("Rule 2", results)
        
        # Verifica che rule inattiva non sia stata eseguita
        # (run_company_automations filtra solo le attive)
        self.assertNotIn("Rule 3 Inactive", results)


class NotificationCreationTest(TestCase):
    """Test creazione notifiche"""
    
    def setUp(self):
        self.company = Company.objects.create(
            name="Test Company Notif",
            slug="test-company-notif",
            status=Company.StatusChoices.ACTIVE,
        )
        
        self.user = User.objects.create_user(
            email="user@testnotif.com",
            password="Pass123!",
            role=User.RoleChoices.EMPLOYEE,
            company=self.company,
            is_active=True,
        )
    
    def test_notification_creation(self):
        """Test creazione notifica"""
        notif = Notification.objects.create(
            user=self.user,
            title="Test Notification",
            message="This is a test notification",
            notification_type=Notification.TypeChoices.INFO,
            priority=Notification.PriorityChoices.MEDIUM,
        )
        
        self.assertIsNotNone(notif)
        self.assertEqual(notif.user, self.user)
        self.assertFalse(notif.is_read)
        self.assertIsNone(notif.read_at)
    
    def test_notification_mark_as_read(self):
        """Test segna notifica come letta"""
        notif = Notification.objects.create(
            user=self.user,
            title="Test",
            message="Message",
            notification_type=Notification.TypeChoices.INFO,
        )
        
        # Segna come letta
        notif.mark_as_read()
        
        # Verifica
        self.assertTrue(notif.is_read)
        self.assertIsNotNone(notif.read_at)


class TaskCreationTest(TestCase):
    """Test creazione task"""
    
    def setUp(self):
        self.company = Company.objects.create(
            name="Test Company Task",
            slug="test-company-task",
            status=Company.StatusChoices.ACTIVE,
        )
        
        self.user = User.objects.create_user(
            email="user@testtask.com",
            password="Pass123!",
            role=User.RoleChoices.COMPANY_ADMIN,
            company=self.company,
            is_active=True,
        )
    
    def test_task_creation(self):
        """Test creazione task"""
        task = Task.objects.create(
            company=self.company,
            assigned_to=self.user,
            title="Test Task",
            description="Task description",
            status=Task.StatusChoices.PENDING,
            priority=Task.PriorityChoices.HIGH,
        )
        
        self.assertIsNotNone(task)
        self.assertEqual(task.company, self.company)
        self.assertEqual(task.assigned_to, self.user)
        self.assertEqual(task.status, Task.StatusChoices.PENDING)
    
    def test_task_from_automation_rule(self):
        """Test creazione task da automation rule"""
        rule = AutomationRule.objects.create(
            company=self.company,
            name="Test Rule for Task",
            trigger_type=AutomationRule.TriggerType.MISSING_CLOCK_IN,
            action_type=AutomationRule.ActionType.CREATE_TASK,
            action_payload={
                "title": "Task from automation",
                "message": "Description from automation"
            },
            is_active=True,
        )
        
        # Crea task da rule
        task = AutomationService.create_task_from_rule(
            rule,
            assigned_to=self.user
        )
        
        self.assertIsNotNone(task)
        self.assertEqual(task.source_rule, rule)
        self.assertEqual(task.company, self.company)
        self.assertIn("automation", task.title.lower())
