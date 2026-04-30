"""
Signature Models
=================

Models for document signature requests, receipts, and audit logging.
"""

from django.conf import settings
from django.db import models

from ._base import BaseModel


def document_upload_to(instance, filename):
    """Upload path for signed documents."""
    return f"signatures/{instance.signer.company.id}/{instance.id}/{filename}"


class SignatureRequest(BaseModel):
    """
    Represents a request for a document signature.
    
    When a document needs to be signed, a SignatureRequest is created
    with a unique access token that can be shared with the signer.
    """

    class StatusChoices(models.TextChoices):
        PENDING = 'pending', 'In attesa'
        VIEWED = 'viewed', 'Visionato'
        SIGNED = 'signed', 'Firmato'
        DECLINED = 'declined', 'Rifiutato'
        EXPIRED = 'expired', 'Scaduto'

    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING,
    )
    access_token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    viewed_at = models.DateTimeField(blank=True, null=True)
    signed_at = models.DateTimeField(blank=True, null=True)
    declined_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField()
    signature_ip = models.GenericIPAddressField(blank=True, null=True)
    signature_user_agent = models.TextField(blank=True)
    signature_hash = models.CharField(max_length=64, blank=True)
    signature_page = models.PositiveIntegerField(default=1)
    signature_x = models.FloatField(default=50)
    signature_y = models.FloatField(default=50)

    # Relations
    document = models.ForeignKey(
        'users.Document',
        on_delete=models.CASCADE,
        related_name='signature_requests',
    )
    signed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='signed_documents',
    )
    signer = models.ForeignKey(
        'users.EmployeeProfile',
        on_delete=models.CASCADE,
        related_name='signature_requests',
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Richiesta Firma'
        verbose_name_plural = 'Richieste Firma'

    def __str__(self):
        return f"SignatureRequest({self.document.title}, {self.signer.user.email}, {self.status})"


class DocumentReceipt(BaseModel):
    """
    Represents a document receipt/acknowledgment.
    
    When a document is shared with an employee, a receipt is created
    to track whether they have viewed and acknowledged it.
    """

    class StatusChoices(models.TextChoices):
        PENDING = 'pending', 'In attesa'
        VIEWED = 'viewed', 'Visionato'
        ACKNOWLEDGED = 'acknowledged', 'Confermato'

    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING,
    )
    access_token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    viewed_at = models.DateTimeField(blank=True, null=True)
    acknowledged_at = models.DateTimeField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    user_note = models.TextField(blank=True)

    # Relations
    document = models.ForeignKey(
        'users.Document',
        on_delete=models.CASCADE,
        related_name='receipts',
    )
    employee = models.ForeignKey(
        'users.EmployeeProfile',
        on_delete=models.CASCADE,
        related_name='document_receipts',
    )

    class Meta:
        ordering = ['-created_at']
        unique_together = [['document', 'employee']]
        verbose_name = 'Ricevuta Documento'
        verbose_name_plural = 'Ricevute Documenti'

    def __str__(self):
        return f"DocumentReceipt({self.document.title}, {self.employee.user.email}, {self.status})"


class SignatureLog(BaseModel):
    """
    Audit log for signature requests and document receipts.
    
    Tracks all actions taken on signature requests and receipts
    for compliance and audit purposes.
    """

    class ActionChoices(models.TextChoices):
        CREATED = 'created', 'Richiesta creata'
        VIEWED = 'viewed', 'Documento visionato'
        SIGNED = 'signed', 'Documento firmato'
        DECLINED = 'declined', 'Firma rifiutata'
        EXPIRED = 'expired', 'Richiesta scaduta'
        RECEIPT_VIEWED = 'receipt_viewed', 'Ricevuta visionata'
        RECEIPT_ACKNOWLEDGED = 'receipt_acknowledged', 'Ricevuta confermata'

    action = models.CharField(
        max_length=30,
        choices=ActionChoices.choices,
    )
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)

    # Relations
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    signature_request = models.ForeignKey(
        SignatureRequest,
        on_delete=models.CASCADE,
        null=True,
        related_name='logs',
    )
    receipt = models.ForeignKey(
        DocumentReceipt,
        on_delete=models.CASCADE,
        null=True,
        related_name='logs',
    )

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Log Firma'
        verbose_name_plural = 'Log Firme'

    def __str__(self):
        return f"SignatureLog({self.action}, {self.timestamp})"
