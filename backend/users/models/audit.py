"""
AuditLog model.
"""

from django.db import models

from ._base import BaseModel
from ._choices import AuditLogActionChoices
from .company import Company
from .users import User


class AuditLog(BaseModel):
    """
    AuditLog model - records all significant actions for compliance tracking.
    """
    # Use centralized choices directly
    ActionChoices = AuditLogActionChoices

    actor = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    company = models.ForeignKey(
        Company,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=50, choices=ActionChoices.choices)
    description = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} - {self.created_at:%Y-%m-%d %H:%M:%S}"