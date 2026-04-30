"""
Notification and NotificationPreference models.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone

from ._base import BaseModel
from ._choices import NotificationPriorityChoices, NotificationTypeChoices, UserDeviceTypeChoices
from .users import User


class Notification(BaseModel):
    """
    Notification model - user notifications for system events.
    """
    # Use centralized choices directly
    PriorityChoices = NotificationPriorityChoices
    TypeChoices = NotificationTypeChoices

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="Utente"
    )

    title = models.CharField(max_length=255, verbose_name="Titolo")
    message = models.TextField(verbose_name="Messaggio")
    notification_type = models.CharField(
        max_length=20,
        choices=TypeChoices.choices,
        default=TypeChoices.INFO,
        verbose_name="Tipo"
    )
    priority = models.CharField(
        max_length=20,
        choices=PriorityChoices.choices,
        default=PriorityChoices.MEDIUM,
        verbose_name="Priorita"
    )

    is_read = models.BooleanField(default=False, verbose_name="Letta")
    action_url = models.CharField(max_length=255, blank=True, verbose_name="URL azione")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Metadati")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creato il")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="Letto il")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Notifica"
        verbose_name_plural = "Notifiche"
        indexes = [
            models.Index(fields=["user", "is_read", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title}"

    def mark_as_read(self):
        """Mark notification as read with timestamp"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class UserDeviceToken(BaseModel):
    """
    UserDeviceToken model - device tokens for push notifications.
    """
    # Use centralized choices directly
    DeviceType = UserDeviceTypeChoices

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='device_tokens')
    fcm_token = models.CharField(max_length=255)
    device_type = models.CharField(max_length=20, choices=DeviceType.choices, default=DeviceType.WEB)
    device_name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    # Web push subscription data
    endpoint = models.URLField(max_length=500, blank=True)
    p256dh = models.CharField(max_length=64, blank=True)
    auth = models.CharField(max_length=64, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['user', 'fcm_token']

    def __str__(self):
        return f"{self.user.email} - {self.device_type}"