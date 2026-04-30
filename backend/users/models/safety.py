"""
SafetyCourse, EmployeeTraining, SafetyInspection, and SafetyAlert models.
"""

from django.db import models
from django.utils import timezone

from ._base import BaseModel, TimestampedModel
from ._choices import (
    EmployeeTrainingStatusChoices,
    SafetyAlertSeverityChoices,
    SafetyAlertTypeChoices,
    SafetyCourseCategoryChoices,
    SafetyInspectionRiskLevelChoices,
    SafetyInspectionStatusChoices,
)
from .company import Company
from .employee import EmployeeProfile
from .users import User


class SafetyCourse(TimestampedModel):
    """
    SafetyCourse model - mandatory workplace safety training courses.
    """
    # Use centralized choices directly
    CategoryChoices = SafetyCourseCategoryChoices

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="safety_courses"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=50,
        choices=CategoryChoices.choices,
        default=CategoryChoices.GENERAL
    )
    duration_minutes = models.IntegerField(default=60)
    validity_months = models.IntegerField(default=12)
    is_mandatory = models.BooleanField(default=True)
    content_url = models.URLField(blank=True)

    class Meta:
        ordering = ["title"]
        verbose_name = "Corso di Sicurezza"
        verbose_name_plural = "Corsi di Sicurezza"

    def __str__(self):
        return f"{self.company.name} - {self.title}"

    def get_expiry_date(self, from_date=None):
        """Calculate expiry date based on validity months"""
        from dateutil.relativedelta import relativedelta
        if from_date is None:
            from_date = timezone.now()
        return from_date + relativedelta(months=self.validity_months)


class EmployeeTraining(BaseModel):
    """
    EmployeeTraining model - course assignments to employees.
    """
    # Use centralized choices directly
    StatusChoices = EmployeeTrainingStatusChoices

    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,
        related_name="safety_trainings"
    )
    course = models.ForeignKey(
        SafetyCourse,
        on_delete=models.CASCADE,
        related_name="employee_trainings"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField()
    completed_at = models.DateTimeField(null=True, blank=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(null=True, blank=True)
    certificate_url = models.URLField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-assigned_at"]
        verbose_name = "Formazione Dipendente"
        verbose_name_plural = "Formazioni Dipendenti"
        unique_together = ["employee", "course"]

    def __str__(self):
        return f"{self.employee.full_name} - {self.course.title}"

    def save(self, *args, **kwargs):
        """Set default due date based on course validity if not provided"""
        from dateutil.relativedelta import relativedelta
        if not self.due_date:
            self.due_date = timezone.now().date() + relativedelta(months=self.course.validity_months)
        super().save(*args, **kwargs)

    def mark_completed(self, score=None, certificate_url=None):
        """Mark training as completed with optional score and certificate"""
        self.completed_at = timezone.now()
        self.status = self.StatusChoices.COMPLETED
        if score is not None:
            self.score = score
        if certificate_url:
            self.certificate_url = certificate_url
        self.expiry_date = self.course.get_expiry_date(from_date=self.completed_at)
        self.save(update_fields=['completed_at', 'status', 'score', 'certificate_url', 'expiry_date'])


class SafetyInspection(TimestampedModel):
    """
    SafetyInspection model - workplace safety inspections.
    """
    # Use centralized choices directly
    StatusChoices = SafetyInspectionStatusChoices
    RiskLevelChoices = SafetyInspectionRiskLevelChoices

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="safety_inspections"
    )
    location = models.CharField(max_length=255)
    inspector = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conducted_inspections"
    )
    scheduled_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.SCHEDULED
    )
    findings = models.TextField(blank=True)
    risk_level = models.CharField(
        max_length=20,
        choices=RiskLevelChoices.choices,
        default=RiskLevelChoices.LOW
    )
    corrective_actions = models.TextField(blank=True)

    class Meta:
        ordering = ["-scheduled_date"]
        verbose_name = "Ispezione di Sicurezza"
        verbose_name_plural = "Ispezioni di Sicurezza"

    def __str__(self):
        return f"{self.company.name} - {self.location} ({self.scheduled_date})"

    def complete(self, findings, risk_level, corrective_actions):
        """Complete the inspection with results"""
        self.completed_date = timezone.now().date()
        self.status = self.StatusChoices.COMPLETED
        self.findings = findings
        self.risk_level = risk_level
        self.corrective_actions = corrective_actions
        self.save(update_fields=['completed_date', 'status', 'findings', 'risk_level', 'corrective_actions', 'updated_at'])


class SafetyAlert(BaseModel):
    """
    SafetyAlert model - alerts for course expirations and detected risks.
    """
    # Use centralized choices directly
    AlertTypeChoices = SafetyAlertTypeChoices
    SeverityChoices = SafetyAlertSeverityChoices

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="safety_alerts"
    )
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="safety_alerts"
    )
    alert_type = models.CharField(
        max_length=50,
        choices=AlertTypeChoices.choices
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    severity = models.CharField(
        max_length=20,
        choices=SeverityChoices.choices,
        default=SeverityChoices.INFO
    )
    is_read = models.BooleanField(default=False)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Alert Sicurezza"
        verbose_name_plural = "Alert Sicurezza"
        indexes = [
            models.Index(fields=["company", "is_read", "-created_at"]),
            models.Index(fields=["company", "alert_type", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.alert_type} - {self.title}"

    def mark_as_read(self):
        """Mark alert as read with timestamp"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


def generate_safety_alerts_for_company(company):
    """
    Generate automatic safety alerts for a company based on training data.
    """
    from datetime import timedelta
    today = timezone.now().date()
    warning_date = today + timedelta(days=30)

    # Find courses expiring within 30 days
    expiring_trainings = EmployeeTraining.objects.filter(
        employee__company=company,
        status='pending',
        due_date__lte=warning_date,
        due_date__gte=today
    ).select_related('employee', 'course')

    for training in expiring_trainings:
        SafetyAlert.objects.get_or_create(
            company=company,
            employee=training.employee,
            alert_type=SafetyAlert.AlertTypeChoices.COURSE_EXPIRING,
            title=f"Corso in scadenza: {training.course.title}",
            defaults={
                'message': f"Il corso {training.course.title} per {training.employee.full_name} scade il {training.due_date}",
                'severity': SafetyAlert.SeverityChoices.WARNING,
                'due_date': training.due_date
            }
        )

    # Find expired courses
    expired_trainings = EmployeeTraining.objects.filter(
        employee__company=company,
        status='pending',
        due_date__lt=today
    ).select_related('employee', 'course')

    for training in expired_trainings:
        SafetyAlert.objects.get_or_create(
            company=company,
            employee=training.employee,
            alert_type=SafetyAlert.AlertTypeChoices.COURSE_EXPIRED,
            title=f"Corso scaduto: {training.course.title}",
            defaults={
                'message': f"Il corso {training.course.title} per {training.employee.full_name} e' scaduto il {training.due_date}",
                'severity': SafetyAlert.SeverityChoices.CRITICAL,
                'due_date': training.due_date
            }
        )