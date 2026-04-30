"""
MedicalVisit and MedicalCertificate models.
"""

import hashlib

from django.db import models
from django.utils import timezone

from ._base import BaseModel, TimestampedModel
from ._choices import (
    MedicalCertificateStatusChoices,
    MedicalCertificateTypeChoices,
    MedicalVisitStatusChoices,
    MedicalVisitTypeChoices,
)
from .company import Company
from .employee import EmployeeProfile
from .leave import LeaveRequest
from .users import User


class MedicalVisit(TimestampedModel):
    """
    MedicalVisit model - scheduled medical visits for employees.
    """
    # Use centralized choices directly
    VisitType = MedicalVisitTypeChoices
    Status = MedicalVisitStatusChoices

    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='medical_visits')
    employee = models.ForeignKey('EmployeeProfile', on_delete=models.CASCADE, related_name='medical_visits')
    visit_type = models.CharField(max_length=20, choices=VisitType.choices, default=VisitType.PERIODIC)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)

    scheduled_date = models.DateField()
    scheduled_time = models.TimeField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    doctor_name = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    completed_date = models.DateField(null=True, blank=True)
    result = models.TextField(blank=True)
    next_visit_date = models.DateField(null=True, blank=True)

    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='created_visits')

    class Meta:
        ordering = ['-scheduled_date']

    def __str__(self):
        return f"{self.employee} - {self.get_visit_type_display()} - {self.scheduled_date}"

    @property
    def is_expiring_soon(self):
        """Check if visit is scheduled within next 30 days"""
        if self.status == self.Status.SCHEDULED:
            days_until = (self.scheduled_date - timezone.now().date()).days
            return 0 <= days_until <= 30
        return False

    @property
    def is_overdue(self):
        """Check if scheduled visit date has passed"""
        if self.status == self.Status.SCHEDULED:
            return self.scheduled_date < timezone.now().date()
        return False


class MedicalCertificate(TimestampedModel):
    """
    MedicalCertificate model - INPS medical certificates for sick leave.
    """
    # Use centralized choices directly
    CertificateType = MedicalCertificateTypeChoices
    Status = MedicalCertificateStatusChoices

    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='medical_certificates')
    employee = models.ForeignKey('EmployeeProfile', on_delete=models.CASCADE, related_name='medical_certificates')
    certificate_type = models.CharField(max_length=20, choices=CertificateType.choices, default=CertificateType.SICKNESS)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # INPS certificate codes
    inps_code = models.CharField(max_length=20, blank=True, db_index=True)
    inps_protocol = models.CharField(max_length=50, blank=True)

    # Certificate dates
    start_date = models.DateField()
    end_date = models.DateField()
    expected_return_date = models.DateField(null=True, blank=True)

    # Diagnosis information
    diagnosis_code = models.CharField(max_length=50, blank=True)
    diagnosis_description = models.TextField(blank=True)

    # Certificate issuer
    doctor_name = models.CharField(max_length=255, blank=True)
    doctor_tax_code = models.CharField(max_length=16, blank=True)
    medical_facility = models.CharField(max_length=255, blank=True)

    # Attached documents
    attachment = models.FileField(upload_to='certificates/', null=True, blank=True)

    # Hash for integrity verification
    content_hash = models.CharField(max_length=64, blank=True)

    # Validation
    validated_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='validated_certificates')
    validated_at = models.DateTimeField(null=True, blank=True)
    validation_notes = models.TextField(blank=True)

    # Link to leave request
    leave_request = models.ForeignKey(LeaveRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='certificates')

    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='created_certificates')

    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['employee', 'start_date']),
            models.Index(fields=['inps_code']),
        ]

    def __str__(self):
        return f"{self.employee} - {self.get_certificate_type_display()} - {self.start_date}"

    def generate_hash(self):
        """Generate SHA-256 hash for content integrity verification"""
        content = f"{self.employee.id}|{self.inps_code}|{self.start_date}|{self.end_date}"
        self.content_hash = hashlib.sha256(content.encode()).hexdigest()
        return self.content_hash

    @property
    def duration_days(self):
        """Calculate certificate duration in days (inclusive)"""
        return (self.end_date - self.start_date).days + 1

    @property
    def is_active(self):
        """Check if certificate is currently active (validated and within date range)"""
        today = timezone.now().date()
        return self.status == self.Status.VALIDATED and self.start_date <= today <= self.end_date