"""
Document model.
"""

from django.db import models

from ._base import TimestampedModel
from ._choices import DocumentCategoryChoices, DocumentStatusChoices, DocumentVisibilityChoices
from .company import Company, protected_document_upload_to
from .employee import EmployeeProfile
from .users import User


class Document(TimestampedModel):
    """
    Document model - file attachments with access control.
    """
    # Use centralized choices directly
    CategoryChoices = DocumentCategoryChoices
    VisibilityChoices = DocumentVisibilityChoices
    StatusChoices = DocumentStatusChoices

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="documents")
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_documents",
    )
    category = models.CharField(max_length=40, choices=CategoryChoices.choices, default=CategoryChoices.OTHER)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to=protected_document_upload_to)
    mime_type = models.CharField(max_length=120, blank=True)
    file_size = models.PositiveBigIntegerField(default=0)
    visibility = models.CharField(
        max_length=40,
        choices=VisibilityChoices.choices,
        default=VisibilityChoices.COMPANY_AND_CONSULTANT,
    )
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.DRAFT)
    archived_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.company.name} - {self.title}"