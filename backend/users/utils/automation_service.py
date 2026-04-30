"""
Automation Service
==================
Gestisce l'esecuzione delle automazioni per PulseHR.
"""
from django.utils import timezone
from datetime import timedelta
from users.models import AutomationRule, Notification, Task, TimeEntry, LeaveRequest, Document, EmployeeProfile


class AutomationService:
    """Service per eseguire automazioni."""

    @staticmethod
    def run_missing_clock_in_check(company):
        """
        Controlla dipendenti senza check-in entro le ore configurate.
        Default: segnala se non timbrano entro le 10:00.
        """
        now = timezone.now()
        target_hour = 10

        if now.hour < target_hour:
            return []  # Non ancora tempo di controllare

        # Trova dipendenti attivi
        employees = EmployeeProfile.objects.filter(
            company=company,
            user__is_active=True
        )

        notified = []
        for emp in employees:
            # Controlla se ha timbrato oggi
            has_today = TimeEntry.objects.filter(
                employee_profile=emp,
                timestamp__date=now.date()
            ).exists()

            if not has_today:
                # Trova condizioni dalla rule o usa default
                rule_conditions = {'hours': target_hour}

                # Crea notifica
                Notification.objects.create(
                    user=emp.user,
                    title='Timbrazione mancante',
                    message=f'Non hai timbrato entro le {rule_conditions.get("hours", 10)}:00. Ti ricordiamo di registrare la tua presenza.',
                    notification_type=Notification.TypeChoices.WARNING,
                    priority=Notification.PriorityChoices.MEDIUM,
                    action_url='/attendance'
                )
                notified.append(emp.user.email)

        return notified

    @staticmethod
    def run_pending_leave_check(company):
        """Segnala ferie pending da piu di 2 giorni."""
        threshold_days = 2
        cutoff = timezone.now() - timedelta(days=threshold_days)

        pending = LeaveRequest.objects.filter(
            company=company,
            status=LeaveRequest.StatusChoices.PENDING,
            created_at__lt=cutoff
        )

        notified = []
        for leave in pending:
            # Notifica all'admin azienda
            admin = company.users.filter(
                role__in=['company_admin', 'company_owner']
            ).first()
            if admin:
                Notification.objects.create(
                    user=admin,
                    title='Ferie in attesa',
                    message=f'Revisiona la richiesta ferie di {leave.employee.full_name} inviata il {leave.created_at.strftime("%d/%m/%Y")}',
                    notification_type=Notification.TypeChoices.INFO,
                    priority=Notification.PriorityChoices.HIGH,
                    action_url='/company/leave'
                )
                notified.append(admin.email)

        return notified

    @staticmethod
    def run_document_expiring_check(company):
        """Segnala documenti in scadenza tra 30 giorni."""
        warning_date = timezone.now().date() + timedelta(days=30)

        expiring = Document.objects.filter(
            company=company,
            expiry_date__lte=warning_date,
            expiry_date__gte=timezone.now().date()
        )

        notified = []
        for doc in expiring:
            # Assicura che il documento abbia assigned_to
            if hasattr(doc, 'assigned_to') and doc.assigned_to.exists():
                for emp in doc.assigned_to.all():
                    Notification.objects.create(
                        user=emp,
                        title='Documento in scadenza',
                        message=f'Il documento "{doc.title}" scadra il {doc.expiry_date.strftime("%d/%m/%Y")}',
                        notification_type=Notification.TypeChoices.WARNING,
                        priority=Notification.PriorityChoices.HIGH,
                        action_url='/company/documents'
                    )
                    notified.append(emp.email)

        return notified

    @staticmethod
    def run_document_not_acknowledged_check(company):
        """Segnala documenti non confermati dopo 7 giorni."""
        from .models import DocumentReceipt

        warning_days = 7
        cutoff = timezone.now() - timedelta(days=warning_days)

        # Trova receipts non ancora confermati
        unacknowledged = DocumentReceipt.objects.filter(
            document__company=company,
            status=DocumentReceipt.StatusChoices.PENDING,
            created_at__lt=cutoff
        ).select_related('document', 'employee')

        notified = []
        for receipt in unacknowledged:
            # Notifica all'azienda
            admin = company.users.filter(
                role__in=['company_admin', 'company_owner']
            ).first()
            if admin:
                Notification.objects.create(
                    user=admin,
                    title='Documento non confermato',
                    message=f'{receipt.employee.full_name} non ha confermato il documento "{receipt.document.title}"',
                    notification_type=Notification.TypeChoices.WARNING,
                    priority=Notification.PriorityChoices.MEDIUM,
                    action_url='/company/documents'
                )
                notified.append(admin.email)

        return notified

    @staticmethod
    def execute_automation(rule):
        """Esegue una singola automazione."""
        if not rule.is_active:
            return []

        rule.last_run_at = timezone.now()
        rule.save()

        trigger_handlers = {
            'missing_clock_in': AutomationService.run_missing_clock_in_check,
            'leave_pending_long': AutomationService.run_pending_leave_check,
            'document_expiring': AutomationService.run_document_expiring_check,
            'document_not_acknowledged': AutomationService.run_document_not_acknowledged_check,
        }

        handler = trigger_handlers.get(rule.trigger_type)
        if handler:
            return handler(rule.company)

        return []

    @staticmethod
    def run_company_automations(company):
        """Esegue tutte le automazioni attive per un'azienda."""
        rules = AutomationRule.objects.filter(
            company=company,
            is_active=True
        )

        results = {}
        for rule in rules:
            try:
                results[rule.name] = AutomationService.execute_automation(rule)
            except Exception as e:
                results[rule.name] = {'error': str(e)}

        return results

    @staticmethod
    def create_task_from_rule(rule, title=None, description=None, assigned_to=None):
        """Crea un task da una regola di automazione."""
        payload = rule.action_payload or {}

        return Task.objects.create(
            company=rule.company,
            title=title or payload.get('title', f'Automazione: {rule.name}'),
            description=description or payload.get('message', rule.description),
            assigned_to=assigned_to,
            source_rule=rule,
            priority=Task.PriorityChoices.MEDIUM
        )