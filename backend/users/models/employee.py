"""
EmployeeProfile and ConsultantCompanyLink models.
"""

import uuid

from django.db import models

from ._base import BaseModel, TimestampedModel
from ._choices import (
    ConsultantLinkRequestedByChoices,
    ConsultantLinkStatusChoices,
    EmployeeStatusChoices,
)
from .company import Company, Department, OfficeLocation
from .users import User


class ConsultantCompanyLink(BaseModel):
    """
    ConsultantCompanyLink model - links consultants to companies they work with.
    """
    # Use centralized choices directly
    StatusChoices = ConsultantLinkStatusChoices
    RequestedByChoices = ConsultantLinkRequestedByChoices

    consultant = models.ForeignKey(User, on_delete=models.CASCADE, related_name="consultant_company_links")
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="consultant_company_links")
    status = models.CharField(max_length=24, choices=StatusChoices.choices)
    requested_by = models.CharField(max_length=24, choices=RequestedByChoices.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("consultant", "company")

    def __str__(self):
        return f"{self.consultant.email} <-> {self.company.name}"


class EmployeeProfile(TimestampedModel):
    """
    EmployeeProfile model - employee-specific data linked to User accounts.
    """
    # Use centralized choices directly
    StatusChoices = EmployeeStatusChoices

    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employee_profile",
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="employee_profiles")
    employee_code = models.CharField(max_length=64)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )
    office_location = models.ForeignKey(
        OfficeLocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )
    manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="direct_reports",
    )
    hire_date = models.DateField(null=True, blank=True)
    job_title = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    emergency_contact = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["company__name", "first_name", "last_name", "employee_code"]
        unique_together = ("company", "employee_code")

    def __str__(self):
        return f"{self.company.name} - {self.employee_code}"

    @property
    def full_name(self):
        """Returns employee's full name"""
        return f"{self.first_name} {self.last_name}".strip()