"""
TimeEntry, AttendanceDayReview, AttendancePeriod, and AttendanceCorrection models.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone

from ._base import BaseModel, TimestampedModel
from ._choices import (
    AttendanceCorrectionActionTypeChoices,
    AttendanceDayReviewStatusChoices,
    AttendancePeriodStatusChoices,
    OfflineTimeEntrySyncStatusChoices,
    TimeEntryLocationSourceChoices,
    TimeEntrySourceChoices,
    TimeEntryTypeChoices,
)
from .company import Company, OfficeLocation
from .employee import EmployeeProfile
from .users import User


class TimeEntry(BaseModel):
    """
    TimeEntry model - clock in/out records for attendance tracking.
    """
    # Use centralized choices directly
    EntryTypeChoices = TimeEntryTypeChoices
    SourceChoices = TimeEntrySourceChoices
    LocationSourceChoices = TimeEntryLocationSourceChoices

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="time_entries")
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="time_entries")
    employee_profile = models.ForeignKey(
        'EmployeeProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='time_entries',
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_time_entries",
    )
    timestamp = models.DateTimeField(default=timezone.now)
    entry_type = models.CharField(max_length=20, choices=EntryTypeChoices.choices)
    note = models.CharField(max_length=255, blank=True)
    source = models.CharField(max_length=20, choices=SourceChoices.choices, default=SourceChoices.WEB)
    is_manual = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # GPS/Geolocation fields
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        null=True, blank=True,
        help_text="Check-in latitude"
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        null=True, blank=True,
        help_text="Check-in longitude"
    )
    accuracy_meters = models.DecimalField(
        max_digits=6, decimal_places=2,
        null=True, blank=True,
        help_text="GPS accuracy in meters"
    )
    location_source = models.CharField(
        max_length=20,
        blank=True,
        choices=LocationSourceChoices.choices,
        default=LocationSourceChoices.GPS
    )
    # Geofencing
    office_location = models.ForeignKey(
        OfficeLocation,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='check_ins'
    )
    is_within_geofence = models.BooleanField(default=True)

    class Meta:
        ordering = ["-timestamp", "-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.entry_type} - {self.timestamp:%Y-%m-%d %H:%M:%S}"


class AttendanceDayReview(TimestampedModel):
    """
    AttendanceDayReview model - daily attendance review/approval.
    """
    # Use centralized choices directly
    StatusChoices = AttendanceDayReviewStatusChoices

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="attendance_day_reviews")
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="attendance_day_reviews")
    date = models.DateField()
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.DRAFT)
    anomalies = models.JSONField(default=list, blank=True)
    review_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_attendance_days",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_attendance_days",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-date", "user__email"]
        unique_together = ("company", "user", "date")

    def __str__(self):
        return f"{self.company.name} - {self.user.email} - {self.date}"


class AttendancePeriod(TimestampedModel):
    """
    AttendancePeriod model - monthly attendance period for aggregation.
    """
    # Use centralized choices directly
    StatusChoices = AttendancePeriodStatusChoices

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="attendance_periods")
    month = models.PositiveSmallIntegerField()
    year = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.OPEN)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_attendance_periods",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-year", "-month", "company__name"]
        unique_together = ("company", "year", "month")

    def __str__(self):
        return f"{self.company.name} - {self.month:02d}/{self.year}"


class AttendanceCorrection(BaseModel):
    """
    AttendanceCorrection model - records changes to attendance data.
    """
    # Use centralized choices directly
    ActionTypeChoices = AttendanceCorrectionActionTypeChoices

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="attendance_corrections")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="attendance_corrections")
    date = models.DateField()
    time_entry = models.ForeignKey(
        TimeEntry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="corrections",
    )
    action_type = models.CharField(max_length=20, choices=ActionTypeChoices.choices)
    reason = models.TextField()
    original_value = models.JSONField(default=dict, blank=True)
    new_value = models.JSONField(default=dict, blank=True)
    corrected_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="performed_attendance_corrections",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.company.name} - {self.user.email} - {self.action_type}"


class OfflineTimeEntry(BaseModel):
    """
    OfflineTimeEntry model - manages offline clock entries that sync later.
    """
    # Use centralized choices directly
    SyncStatus = OfflineTimeEntrySyncStatusChoices

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='offline_entries')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='offline_entries')

    entry_type = models.CharField(max_length=20, choices=[
        ('check_in', 'Check-in'),
        ('check_out', 'Check-out'),
        ('break_start', 'Inizio pausa'),
        ('break_end', 'Fine pausa'),
    ])
    timestamp = models.DateTimeField()
    source = models.CharField(max_length=20, default='mobile_offline')

    # GPS data
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_accuracy = models.FloatField(null=True, blank=True)

    notes = models.TextField(blank=True)

    sync_status = models.CharField(max_length=20, choices=SyncStatus.choices, default=SyncStatus.PENDING)
    synced_at = models.DateTimeField(null=True, blank=True)
    sync_error = models.TextField(blank=True)

    time_entry = models.ForeignKey('TimeEntry', on_delete=models.SET_NULL, null=True, blank=True, related_name='offline_source')

    device_id = models.CharField(max_length=255, blank=True)
    app_version = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'sync_status']),
            models.Index(fields=['company', 'created_at']),
        ]

    def __str__(self):
        return f"Offline {self.user} - {self.entry_type} @ {self.timestamp}"


class AbsenceType(TimestampedModel):
    """
    AbsenceType model - configurable absence types for companies.
    """
    from .medical import MedicalCertificate

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='absence_types')

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    requires_certificate = models.BooleanField(default=False)
    certificate_type = models.CharField(max_length=20, choices=MedicalCertificate.CertificateType.choices, blank=True)

    max_days_per_year = models.IntegerField(null=True, blank=True)
    max_consecutive_days = models.IntegerField(null=True, blank=True)
    requires_approval = models.BooleanField(default=True)

    is_paid = models.BooleanField(default=True)
    deduction_code = models.CharField(max_length=50, blank=True)

    color = models.CharField(max_length=7, default='#6B7280')
    icon = models.CharField(max_length=50, default='calendar')

    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']
        unique_together = ['company', 'code']

    def __str__(self):
        return f"{self.company.name} - {self.name}"