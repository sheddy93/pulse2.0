"""
Django signals for PulseHR models.
These signals are auto-loaded when the models package is imported.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver


def import_and_connect_signals():
    """
    Import all model modules to ensure signals are connected.
    This function should be called once when the app is ready.
    """
    # Import models to trigger signal registration
    from .employee import ConsultantCompanyLink, EmployeeProfile  # noqa
    from .notifications import Notification  # noqa
    from .users import User  # noqa


# Connect signals when this module is imported
def _connect_signals():
    """Connect signal handlers."""
    # Import locally to avoid circular imports at module load time
    from .employee import ConsultantCompanyLink, EmployeeProfile
    from .notifications import Notification
    from .users import User

    @receiver(post_save, sender=EmployeeProfile)
    def notify_new_employee(sender, instance, created, **kwargs):
        """Send notification when a new employee profile is created."""
        if created:
            # Notify HR managers and company admins about new employee
            company_admins = User.objects.filter(
                company=instance.company,
                role__in=['company_admin', 'hr_manager']
            )
            for admin in company_admins:
                Notification.objects.create(
                    user=admin,
                    title="Nuovo dipendente",
                    message=f"{instance.full_name} e' stato aggiunto all'azienda",
                    notification_type=Notification.TypeChoices.INFO,
                    action_url=f"/company/employees/{instance.id}/"
                )

    @receiver(post_save, sender=ConsultantCompanyLink)
    def notify_link_status_change(sender, instance, **kwargs):
        """Send notification when consultant-company link status changes."""
        if instance.status == 'approved':
            Notification.objects.create(
                user=instance.consultant,
                title="Collegamento approvato",
                message=f"L'azienda {instance.company.name} ha approvato la richiesta",
                notification_type=Notification.TypeChoices.SUCCESS
            )


# Connect signals immediately when this module is imported
_connect_signals()