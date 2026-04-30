"""
Role, Permission, and CompanyRole models.
"""

from django.db import models

from ._base import TimestampedModel
from ._choices import RoleScopeChoices


class Role(TimestampedModel):
    """
    Role model - defines system-wide roles (global vs company-scoped).
    """
    # Use centralized choices directly
    Scope = RoleScopeChoices

    name = models.CharField(max_length=120)
    code = models.SlugField(unique=True)
    scope = models.CharField(max_length=20, choices=Scope.choices, default=Scope.COMPANY)
    description = models.CharField(max_length=255, blank=True)
    is_system = models.BooleanField(default=True)

    class Meta:
        ordering = ["scope", "name"]

    def __str__(self):
        return self.name


class Permission(TimestampedModel):
    """
    Permission model - defines granular permissions for access control.
    """
    module = models.CharField(max_length=80)
    action = models.CharField(max_length=80)
    code = models.SlugField(unique=True)
    name = models.CharField(max_length=120)
    description = models.CharField(max_length=255, blank=True)
    is_system = models.BooleanField(default=True)

    class Meta:
        ordering = ["module", "action", "name"]

    def __str__(self):
        return self.code


class CompanyRole(TimestampedModel):
    """
    CompanyRole model - company-specific roles with assigned permissions.
    """
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name="company_roles")
    name = models.CharField(max_length=120)
    code = models.SlugField()
    description = models.CharField(max_length=255, blank=True)
    permissions = models.ManyToManyField(Permission, blank=True, related_name="company_roles")
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["company__name", "name"]
        unique_together = ("company", "code")

    def __str__(self):
        return f"{self.company.name} - {self.name}"