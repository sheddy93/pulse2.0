"""
Company, Department, and OfficeLocation models.
"""

import secrets
import uuid

from django.db import models
from django.utils import timezone

from ._base import SoftDeleteModel, TimestampedModel
from ._choices import (
    CompanyBillingCycleChoices,
    CompanyStatusChoices,
)


def protected_document_upload_to(instance, filename):
    """Generate upload path for protected documents with company-specific folders"""
    from pathlib import Path
    extension = Path(filename).suffix.lower()
    return f"protected/company_{instance.company_id}/{timezone.now():%Y/%m}/{uuid.uuid4().hex}{extension}"


class Company(SoftDeleteModel):
    """
    Company model - represents a business tenant in the multi-tenant HR system.
    """
    # Use centralized choices directly
    StatusChoices = CompanyStatusChoices
    BillingCycleChoices = CompanyBillingCycleChoices

    name = models.CharField(max_length=255)
    public_id = models.CharField(max_length=24, unique=True, editable=False, blank=True, null=True)
    legal_name = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(unique=True)
    vat_number = models.CharField(max_length=64, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=32, blank=True)
    website = models.URLField(blank=True)
    country_code = models.CharField(max_length=2, blank=True)
    city = models.CharField(max_length=120, blank=True)
    state_region = models.CharField(max_length=120, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    address_line_1 = models.CharField(max_length=255, blank=True)
    address_line_2 = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.TRIAL)
    plan = models.CharField(max_length=120, blank=True)
    billing_cycle = models.CharField(max_length=20, choices=BillingCycleChoices.choices, default=BillingCycleChoices.MONTHLY)
    subscription_end_date = models.DateField(null=True, blank=True)
    max_employees = models.PositiveIntegerField(default=50)
    current_storage_mb = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Storage currently used in MB")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "companies"

    def __str__(self):
        return self.name

    @property
    def access_allowed(self):
        """Check if company has active/trial status for platform access"""
        return (not self.is_deleted) and self.status in {
            self.StatusChoices.ACTIVE,
            self.StatusChoices.TRIAL,
        }

    def save(self, *args, **kwargs):
        """Override save to auto-generate public_id and handle soft delete timestamps"""
        if not self.public_id:
            self.public_id = self.generate_public_id()
        self.is_active = self.access_allowed
        if self.is_deleted and not self.deleted_at:
            self.deleted_at = timezone.now()
        if not self.is_deleted:
            self.deleted_at = None
        super().save(*args, **kwargs)

    @classmethod
    def generate_public_id(cls):
        """Generate a unique 14-character uppercase public ID for company sharing"""
        while True:
            candidate = secrets.token_urlsafe(9).replace("-", "").replace("_", "")[:14].upper()
            if not cls.objects.filter(public_id=candidate).exists():
                return candidate


class Department(TimestampedModel):
    """
    Department model - organizational units within a company.
    """
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="departments")
    name = models.CharField(max_length=120)
    code = models.SlugField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["company__name", "name"]
        unique_together = ("company", "code")

    def __str__(self):
        return f"{self.company.name} - {self.name}"


class OfficeLocation(TimestampedModel):
    """
    OfficeLocation model - physical workplace locations with optional geofencing.
    """
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="office_locations")
    name = models.CharField(max_length=120)
    address_line_1 = models.CharField(max_length=255, blank=True)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120, blank=True)
    state_region = models.CharField(max_length=120, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    country_code = models.CharField(max_length=2, blank=True)
    is_active = models.BooleanField(default=True)

    # Geofence fields - for attendance verification
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        null=True, blank=True
    )
    radius_meters = models.PositiveIntegerField(
        default=100,
        help_text="Geofence radius in meters"
    )
    is_geofence_enabled = models.BooleanField(default=False)

    class Meta:
        ordering = ["company__name", "name"]
        unique_together = ("company", "name")

    def __str__(self):
        return f"{self.company.name} - {self.name}"