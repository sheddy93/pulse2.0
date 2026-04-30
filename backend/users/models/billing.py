"""
StripeCustomer, StripeEvent, PricingPlan, and PricingConfig models.
"""

from django.db import models

from ._base import BaseModel, TimestampedModel
from ._choices import (
    PricingBillingCycleChoices,
    PricingPlanTypeChoices,
    StripeSubscriptionStatusChoices,
)
from .company import Company


class PricingPlan(TimestampedModel):
    """
    PricingPlan model - configurable subscription plans for the platform.
    """
    # Use centralized choices directly
    PlanType = PricingPlanTypeChoices
    BillingCycle = PricingBillingCycleChoices

    name = models.CharField(max_length=100)
    code = models.SlugField(unique=True)
    plan_type = models.CharField(max_length=20, choices=PlanType.choices)

    billing_cycle = models.CharField(max_length=20, choices=BillingCycle.choices)

    price_cents = models.PositiveIntegerField(default=0, help_text="Price in cents (e.g., 4900 = EUR49.00)")
    setup_fee_cents = models.PositiveIntegerField(default=0, help_text="One-time setup fee")

    max_employees = models.PositiveIntegerField(default=10, help_text="Maximum employees allowed")
    max_companies = models.PositiveIntegerField(default=1, help_text="Max companies (for consultants)")
    max_storage_mb = models.PositiveIntegerField(default=1000, help_text="Maximum storage in MB")
    max_file_size_mb = models.PositiveIntegerField(default=50, help_text="Maximum file size in MB")

    include_payroll = models.BooleanField(default=True)
    include_attendance = models.BooleanField(default=True)
    include_documents = models.BooleanField(default=True)
    include_safety = models.BooleanField(default=False)
    include_reports = models.BooleanField(default=False)
    include_api_access = models.BooleanField(default=False)
    include_priority_support = models.BooleanField(default=False)
    include_white_label = models.BooleanField(default=False)

    extra_employee_price_cents = models.PositiveIntegerField(default=100, help_text="Cost per extra employee")

    is_active = models.BooleanField(default=True)
    is_highlighted = models.BooleanField(default=False, help_text="Show as recommended plan")
    display_order = models.PositiveIntegerField(default=0)

    description = models.TextField(blank=True)
    features_list = models.TextField(blank=True, help_text="Feature list separated by newline")
    limitations = models.TextField(blank=True, help_text="Plan limitations")

    class Meta:
        ordering = ["display_order", "plan_type", "billing_cycle"]
        verbose_name = "Piano Tariffario"
        verbose_name_plural = "Piani Tariffari"

    def __str__(self):
        return f"{self.name} ({self.get_billing_cycle_display()})"

    @property
    def price_eur(self):
        """Convert price from cents to euros"""
        return self.price_cents / 100

    @property
    def setup_fee_eur(self):
        """Convert setup fee from cents to euros"""
        return self.setup_fee_cents / 100

    @property
    def extra_employee_price_eur(self):
        """Convert extra employee price from cents to euros"""
        return self.extra_employee_price_cents / 100

    def get_features_list(self):
        """Parse features_list text into array"""
        if self.features_list:
            return [f.strip() for f in self.features_list.split('\n') if f.strip()]
        return []


class PricingConfig(BaseModel):
    """
    PricingConfig model - global pricing settings.
    """

    class Meta:
        verbose_name = "Configurazione Pricing"
        verbose_name_plural = "Configurazioni Pricing"

    currency = models.CharField(max_length=3, default="EUR")
    currency_symbol = models.CharField(max_length=5, default="EUR")

    yearly_discount_percent = models.PositiveIntegerField(default=20, help_text="Discount for annual payment")

    trial_days = models.PositiveIntegerField(default=14, help_text="Free trial days")

    terms_url = models.URLField(blank=True)
    privacy_url = models.URLField(blank=True)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Configurazione Pricing ({self.currency})"


class StripeCustomer(TimestampedModel):
    """
    StripeCustomer model - links Company to Stripe customer and subscription.
    """
    # Use centralized choices directly
    SubscriptionStatus = StripeSubscriptionStatusChoices

    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name='stripe_customer')
    stripe_customer_id = models.CharField(max_length=255, unique=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    subscription_status = models.CharField(
        max_length=20,
        choices=SubscriptionStatus.choices,
        blank=True, null=True
    )
    subscription_current_period_end = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Stripe Customer"
        verbose_name_plural = "Stripe Customers"

    def __str__(self):
        return f"{self.company.name} - {self.stripe_customer_id}"


class StripeEvent(TimestampedModel):
    """
    StripeEvent model - log of Stripe webhook events for idempotency.
    """

    event_type = models.CharField(max_length=255)
    stripe_event_id = models.CharField(max_length=255, unique=True)
    processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    data = models.JSONField(default=dict)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Stripe Event"
        verbose_name_plural = "Stripe Events"

    def __str__(self):
        return f"{self.event_type} - {self.stripe_event_id}"