"""
PayrollRun, Payslip, and PayrollDocumentLink models.
"""

from django.db import models

from ._base import BaseModel, TimestampedModel
from ._choices import PayrollDocumentRoleChoices, PayrollRunStatusChoices
from .company import Company
from .documents import Document
from .employee import EmployeeProfile
from .users import User


class PayrollRun(TimestampedModel):
    """
    PayrollRun model - monthly payroll processing record.
    """
    # Use centralized choices directly
    StatusChoices = PayrollRunStatusChoices

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="payroll_runs")
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name="payroll_runs")
    labor_consultant = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_payroll_runs",
    )
    month = models.PositiveSmallIntegerField()
    year = models.PositiveIntegerField()
    status = models.CharField(max_length=32, choices=StatusChoices.choices, default=StatusChoices.DRAFT)
    notes_company = models.TextField(blank=True)
    notes_consultant = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    period_reference = models.CharField(max_length=120, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-year", "-month", "-updated_at"]
        unique_together = ("company", "employee", "month", "year")

    def __str__(self):
        return f"{self.company.name} - {self.employee.employee_code} - {self.month:02d}/{self.year}"


class PayrollDocumentLink(BaseModel):
    """
    PayrollDocumentLink model - links documents to payroll runs.
    """
    # Use centralized choices directly
    RoleInWorkflowChoices = PayrollDocumentRoleChoices

    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name="document_links")
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="payroll_links")
    role_in_workflow = models.CharField(
        max_length=24,
        choices=RoleInWorkflowChoices.choices,
        default=RoleInWorkflowChoices.ATTACHMENT,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("payroll_run", "document")

    def __str__(self):
        return f"{self.payroll_run_id} -> {self.document_id} ({self.role_in_workflow})"