"""
Base models for PulseHR.
Contains abstract base classes used across all models.
"""

import uuid

from django.db import models
from django.utils import timezone


class BaseModel(models.Model):
    """
    Abstract base model with UUID primary key.
    All models in PulseHR use UUID as primary key for security and distributed setup.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class SoftDeleteManager(models.Manager):
    """
    Manager that filters out soft-deleted objects by default.
    Use .all_objects to include deleted objects.
    """
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class SoftDeleteModel(BaseModel):
    """
    Abstract model with soft delete support.
    Objects are not permanently deleted but marked as is_deleted=True.
    """
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    def delete(self, using=None, keep_parents=False):
        """Soft delete: set is_deleted=True and deleted_at timestamp."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def hard_delete(self, using=None, keep_parents=False):
        """Permanent deletion."""
        super().delete(using=using, keep_parents=keep_parents)

    class Meta:
        abstract = True


class TimestampedModel(BaseModel):
    """
    Abstract model with created_at and updated_at timestamps.
    Automatically manages timestamps on create and update.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True