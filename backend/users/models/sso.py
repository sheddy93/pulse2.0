"""
SSO (Single Sign-On) Models
===========================

Models for SAML 2.0 and OpenID Connect SSO integration.
"""

from django.conf import settings
from django.db import models

from ._base import BaseModel


class SSOProvider(BaseModel):
    """
    Represents an SSO identity provider configuration.
    
    Supports both SAML 2.0 and OpenID Connect protocols.
    Each company can have one SSO provider.
    """

    class ProviderTypeChoices(models.TextChoices):
        SAML = 'saml', 'SAML 2.0'
        OIDC = 'oidc', 'OpenID Connect'

    provider_type = models.CharField(
        max_length=10,
        choices=ProviderTypeChoices.choices,
    )
    entity_id = models.CharField(max_length=255, unique=True)
    sso_url = models.URLField(max_length=500)
    slo_url = models.URLField(max_length=500, blank=True)
    x509_cert = models.TextField()
    client_id = models.CharField(max_length=255, blank=True)
    client_secret = models.CharField(max_length=255, blank=True)
    issuer_url = models.URLField(max_length=500, blank=True)
    email_mapping = models.CharField(max_length=50, default='email')
    first_name_mapping = models.CharField(max_length=50, default='given_name')
    last_name_mapping = models.CharField(max_length=50, default='family_name')
    is_active = models.BooleanField(default=True)
    enforce_sso = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Relations
    company = models.OneToOneField(
        'users.Company',
        on_delete=models.CASCADE,
        related_name='sso_provider',
    )

    class Meta:
        verbose_name = 'SSO Provider'
        verbose_name_plural = 'SSO Providers'

    def __str__(self):
        return f"SSOProvider({self.company.name}, {self.provider_type})"


class SSOSession(BaseModel):
    """
    Represents an active SSO session.
    
    Tracks session details for audit and security purposes.
    """

    session_index = models.CharField(max_length=255, blank=True)
    expires_at = models.DateTimeField()
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Relations
    provider = models.ForeignKey(
        SSOProvider,
        on_delete=models.CASCADE,
        related_name='sessions',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sso_sessions',
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'SSO Session'
        verbose_name_plural = 'SSO Sessions'

    def __str__(self):
        return f"SSOSession({self.user.email}, {self.provider.entity_id})"


class SSOUserLink(BaseModel):
    """
    Links a local user account to an SSO provider user ID.
    
    Allows users to login via SSO while maintaining a link
    to their local account.
    """

    remote_user_id = models.CharField(max_length=255)
    last_sso_login = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Relations
    provider = models.ForeignKey(
        SSOProvider,
        on_delete=models.CASCADE,
        related_name='user_links',
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sso_link',
    )

    class Meta:
        unique_together = [['provider', 'remote_user_id']]
        verbose_name = 'SSO User Link'
        verbose_name_plural = 'SSO User Links'

    def __str__(self):
        return f"SSOUserLink({self.user.email}, {self.provider.entity_id})"
