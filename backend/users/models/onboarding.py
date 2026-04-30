"""
OnboardingProgress and OnboardingTask models.
"""

from django.conf import settings
from django.db import models

from ._base import BaseModel, TimestampedModel
from ._choices import OnboardingRoleTypeChoices
from .company import Company
from .users import User


class OnboardingProgress(TimestampedModel):
    """
    OnboardingProgress model - tracks user onboarding step completion.
    """
    # Use centralized choices directly
    RoleType = OnboardingRoleTypeChoices

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='onboarding_progress'
    )
    company = models.ForeignKey(
        'Company',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='onboarding_progress'
    )
    role = models.CharField(max_length=20, choices=RoleType.choices)
    current_step = models.CharField(max_length=50, default='welcome')
    completed_steps = models.JSONField(default=dict)
    is_completed = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Onboarding Progress'
        verbose_name_plural = 'Onboarding Progress'
        unique_together = ['user', 'role']

    def __str__(self):
        return f"{self.user.email} - {self.role} - Step: {self.current_step}"

    def complete_step(self, step_name):
        """Mark a specific onboarding step as completed"""
        if not self.completed_steps:
            self.completed_steps = {}
        self.completed_steps[step_name] = True
        self.save()

    def get_progress_percentage(self):
        """Calculate overall onboarding completion percentage"""
        total_steps = self.get_total_steps_for_role()
        if total_steps == 0:
            return 0
        completed = len([s for s in self.completed_steps.values() if s])
        return int((completed / total_steps) * 100)

    @staticmethod
    def get_total_steps_for_role():
        """Return total number of onboarding steps per role"""
        return {
            'company': 5,
            'consultant': 5,
            'employee': 4,
        }

    @staticmethod
    def get_steps_for_role(role):
        """Return list of onboarding steps with details for a given role"""
        steps = {
            'company': [
                {'id': 'welcome', 'name': 'Benvenuto', 'description': 'Panoramica PulseHR'},
                {'id': 'complete_profile', 'name': 'Completa Profilo', 'description': 'Configura il tuo profilo'},
                {'id': 'add_employee', 'name': 'Aggiungi Dipendente', 'description': 'Inizia aggiungendo il primo dipendente'},
                {'id': 'invite_consultant', 'name': 'Collega Consulente', 'description': 'Invita il tuo consulente del lavoro'},
                {'id': 'generate_report', 'name': 'Genera Report', 'description': 'Crea il tuo primo report'},
            ],
            'consultant': [
                {'id': 'welcome', 'name': 'Benvenuto', 'description': 'Panoramica PulseHR'},
                {'id': 'complete_profile', 'name': 'Completa Profilo', 'description': 'Configura il tuo profilo'},
                {'id': 'connect_company', 'name': 'Collega Azienda', 'description': "Connettiti con un'azienda cliente"},
                {'id': 'review_dashboard', 'name': 'Revisiona Dashboard', 'description': 'Esplora la dashboard cliente'},
                {'id': 'download_report', 'name': 'Scarica Report', 'description': 'Genera il tuo primo report'},
            ],
            'employee': [
                {'id': 'welcome', 'name': 'Benvenuto', 'description': 'Panoramica PulseHR'},
                {'id': 'complete_profile', 'name': 'Completa Profilo', 'description': 'Completa il tuo profilo'},
                {'id': 'first_clock_in', 'name': 'Prima Timbratura', 'description': 'Effettua la tua prima timbratura'},
                {'id': 'view_documents', 'name': 'Visualizza Documenti', 'description': 'Guarda i documenti aziendali'},
            ],
        }
        return steps.get(role, [])


class OnboardingTask(BaseModel):
    """
    OnboardingTask model - individual onboarding tasks for users.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='onboarding_tasks'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    action_url = models.CharField(max_length=255, blank=True)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name = 'Onboarding Task'
        verbose_name_plural = 'Onboarding Tasks'

    def __str__(self):
        return f"{self.user.email} - {self.title}"