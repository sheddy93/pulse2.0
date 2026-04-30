"""
LeaveRequest and LeaveBalance models.
"""

from django.db import models

from ._base import BaseModel, TimestampedModel
from ._choices import LeaveRequestStatusChoices, LeaveTypeTypeChoices
from .company import Company
from .employee import EmployeeProfile
from .users import User


class LeaveType(TimestampedModel):
    """
    LeaveType model - configurable leave types per company (vacation, sick, etc.).
    """
    # Use centralized choices directly
    TypeChoices = LeaveTypeTypeChoices

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="leave_types")
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    leave_type = models.CharField(max_length=20, choices=TypeChoices.choices, default=TypeChoices.VACATION)
    requires_approval = models.BooleanField(default=True)
    requires_document = models.BooleanField(default=False)
    max_days_per_year = models.PositiveIntegerField(default=0)
    max_consecutive_days = models.PositiveIntegerField(default=0)
    allow_negative_balance = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    color = models.CharField(max_length=7, default="#3b82f6")
    icon = models.CharField(max_length=50, default="calendar")
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "name"]
        unique_together = ["company", "code"]

    def __str__(self):
        return f"{self.company.name} - {self.name}"


class LeaveBalance(BaseModel):
    """
    LeaveBalance model - tracks employee's leave balance for each leave type per year.
    """
    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name="leave_balances")
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name="balances")
    year = models.PositiveIntegerField()
    entitled_days = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    used_days = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    pending_days = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    carry_over_days = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        ordering = ["-year", "leave_type__name"]
        unique_together = ["employee", "leave_type", "year"]

    @property
    def available_days(self):
        """Calculate available days: entitled + carry_over - used - pending"""
        return self.entitled_days + self.carry_over_days - self.used_days - self.pending_days

    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type.name} ({self.year}): {self.available_days}"


class LeaveRequest(TimestampedModel):
    """
    LeaveRequest model - employee requests for time off.
    """
    # Use centralized choices directly
    StatusChoices = LeaveRequestStatusChoices

    employee = models.ForeignKey(EmployeeProfile, on_delete=models.CASCADE, related_name="leave_requests")
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name="requests")
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING)
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.DecimalField(max_digits=5, decimal_places=2)
    half_day_start = models.BooleanField(default=False)
    half_day_end = models.BooleanField(default=False)
    reason = models.TextField(blank=True)
    is_paid = models.BooleanField(default=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leave_approvals"
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="leave_requests")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type.name}: {self.start_date} to {self.end_date}"

    def save(self, *args, **kwargs):
        """Auto-set company from employee if not provided"""
        if not self.company_id and self.employee_id:
            self.company = self.employee.company
        super().save(*args, **kwargs)