"""
User and UserCompanyAccess models.
"""

import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from ._base import BaseModel
from ._choices import UserCompanyAccessScopeChoices, UserRoleChoices
from users.managers import UserManager
from .company import Company
from .roles import CompanyRole


class User(AbstractBaseUser, PermissionsMixin):
    """
    User model - custom user extending Django's auth system with company associations.
    """
    # Use centralized choices directly
    RoleChoices = UserRoleChoices

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=30, choices=RoleChoices.choices, default=RoleChoices.EMPLOYEE)
    company = models.ForeignKey(
        Company,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )
    company_role = models.ForeignKey(
        CompanyRole,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_users",
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ["email"]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        """Returns user's full name by combining first and last name"""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def force_password_change(self):
        """Alias for must_change_password property"""
        return self.must_change_password

    @force_password_change.setter
    def force_password_change(self, value):
        """Setter for force_password_change property"""
        self.must_change_password = value

    @property
    def is_platform_admin(self):
        """Check if user has platform-level admin privileges"""
        return self.role in {
            self.RoleChoices.SUPER_ADMIN,
            self.RoleChoices.PLATFORM_OWNER,
        }

    @property
    def is_consultant(self):
        """Check if user is any type of consultant"""
        return self.role in {
            self.RoleChoices.EXTERNAL_CONSULTANT,
            self.RoleChoices.LABOR_CONSULTANT,
            self.RoleChoices.SAFETY_CONSULTANT,
        }


class UserCompanyAccess(BaseModel):
    """
    UserCompanyAccess model - manages user access to multiple companies (for consultants).
    """
    # Use centralized choices directly
    AccessScopeChoices = UserCompanyAccessScopeChoices

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="company_accesses")
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="user_accesses")
    role = models.ForeignKey('Role', on_delete=models.SET_NULL, null=True, blank=True, related_name="user_accesses")
    company_role = models.ForeignKey(
        CompanyRole,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="user_accesses",
    )
    access_scope = models.CharField(max_length=20, choices=AccessScopeChoices.choices, default=AccessScopeChoices.FULL)
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "company")
        ordering = ["-is_primary", "company__name"]
        verbose_name_plural = "user company accesses"

    def __str__(self):
        return f"{self.user.email} -> {self.company.name}"