"""
Stripe Billing Service for PulseHR

This module provides service functions for Stripe integration:
- create_stripe_customer: Creates a Stripe customer for a company
- create_subscription: Creates a new subscription for a customer
- cancel_subscription: Cancels an existing subscription
- handle_webhook: Processes Stripe webhook events
- get_subscription_status: Gets the current subscription status
"""

import logging
from typing import Optional

import stripe
from django.conf import settings

from .models import Company, StripeCustomer, StripeEvent

logger = logging.getLogger(__name__)


def get_stripe_client():
    """Initialize and return Stripe client with secret key."""
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def create_stripe_customer(company: Company, email: str) -> str:
    """
    Create a Stripe customer for the given company.

    Args:
        company: The Company instance to create customer for
        email: Customer email address

    Returns:
        The Stripe customer ID

    Raises:
        stripe.StripeError: If Stripe API call fails
    """
    stripe_client = get_stripe_client()

    # Create Stripe customer with metadata
    customer = stripe_client.Customer.create(
        email=email,
        name=company.name,
        metadata={
            "company_id": str(company.id),
            "company_name": company.name,
            "company_public_id": company.public_id or "",
        },
        # Store company details in description
        description=f"PulseHR Customer: {company.name} (ID: {company.public_id})",
    )

    logger.info(f"Created Stripe customer {customer.id} for company {company.id}")

    return customer.id


def create_subscription(customer_id: str, price_id: str, company: Company = None) -> str:
    """
    Create a new subscription for a Stripe customer.

    Args:
        customer_id: The Stripe customer ID
        price_id: The Stripe Price ID for the subscription
        company: Optional Company instance for metadata

    Returns:
        The Stripe subscription ID

    Raises:
        stripe.StripeError: If Stripe API call fails
    """
    stripe_client = get_stripe_client()

    # Build subscription metadata
    metadata = {
        "customer_id": customer_id,
    }
    if company:
        metadata["company_id"] = str(company.id)
        metadata["company_name"] = company.name

    # Create subscription
    subscription = stripe_client.Subscription.create(
        customer=customer_id,
        items=[{"price": price_id}],
        payment_behavior="default_incomplete",
        expand=["latest_invoice.payment_intent"],
        metadata=metadata,
    )

    logger.info(f"Created subscription {subscription.id} for customer {customer_id}")

    return subscription.id


def cancel_subscription(subscription_id: str) -> dict:
    """
    Cancel a Stripe subscription.

    Args:
        subscription_id: The Stripe subscription ID to cancel

    Returns:
        Dict with cancellation details

    Raises:
        stripe.StripeError: If Stripe API call fails
    """
    stripe_client = get_stripe_client()

    # Cancel at period end (more graceful) or immediately
    subscription = stripe_client.Subscription.delete(subscription_id)

    logger.info(f"Cancelled subscription {subscription_id}")

    return {
        "id": subscription.id,
        "status": subscription.status,
        "canceled_at": subscription.canceled_at,
    }


def get_subscription_status(subscription_id: str) -> dict:
    """
    Get the current status of a Stripe subscription.

Args:
        subscription_id: The Stripe subscription ID

    Returns:
        Dict with subscription status details

    Raises:
        stripe.StripeError: If Stripe API call fails
    """
    stripe_client = get_stripe_client()

    subscription = stripe_client.Subscription.retrieve(
        subscription_id,
        expand=["items.data.price.product"],
    )

    return {
        "id": subscription.id,
        "status": subscription.status,
        "current_period_start": subscription.current_period_start,
        "current_period_end": subscription.current_period_end,
        "cancel_at_period_end": subscription.cancel_at_period_end,
        "plan": subscription.items.data[0].price.id if subscription.items.data else None,
        "product_name": (
            subscription.items.data[0].price.product.name
            if subscription.items.data else None
        ),
    }


def get_or_create_stripe_customer(company: Company) -> StripeCustomer:
    """
    Get existing Stripe customer or create a new one.

    Args:
        company: The Company instance

    Returns:
        The StripeCustomer instance
    """
    stripe_customer, created = StripeCustomer.objects.get_or_create(
        company=company,
        defaults={"stripe_customer_id": ""},
    )
    return stripe_customer


def update_subscription_status(stripe_customer: StripeCustomer, subscription_data: dict):
    """
    Update StripeCustomer with subscription details from Stripe.

    Args:
        stripe_customer: The StripeCustomer instance to update
        subscription_data: Dict from Stripe subscription API
    """
    stripe_customer.stripe_subscription_id = subscription_data.get("id", "")
    stripe_customer.subscription_status = subscription_data.get("status", "")
    stripe_customer.subscription_current_period_end = (
        subscription_data.get("current_period_end") or None
    )
    stripe_customer.save(update_fields=[
        "stripe_subscription_id",
        "subscription_status",
        "subscription_current_period_end",
        "updated_at",
    ])


def handle_webhook(event_type: str, data: dict, stripe_event_id: str) -> bool:
    """
    Process a Stripe webhook event.

    Args:
        event_type: The Stripe event type (e.g., 'customer.subscription.created')
        data: The event payload data
        stripe_event_id: The unique Stripe event ID for idempotency

    Returns:
        True if processed successfully, False otherwise
    """
    # Check for duplicate event (idempotency)
    if StripeEvent.objects.filter(stripe_event_id=stripe_event_id).exists():
        logger.info(f"Duplicate event {stripe_event_id} already processed, skipping")
        return True

    # Create event record
    event_record = StripeEvent.objects.create(
        event_type=event_type,
        stripe_event_id=stripe_event_id,
        data=data,
        processed=False,
    )

    try:
        # Route to appropriate handler
        handlers = {
            "customer.subscription.created": handle_subscription_created,
            "customer.subscription.updated": handle_subscription_updated,
            "customer.subscription.deleted": handle_subscription_deleted,
            "invoice.payment_succeeded": handle_invoice_payment_succeeded,
            "invoice.payment_failed": handle_invoice_payment_failed,
        }

        handler = handlers.get(event_type)
        if not handler:
            logger.warning(f"No handler for event type: {event_type}")
            event_record.mark_processed()
            return True

        # Execute handler
        handler(data)

        # Mark as processed
        event_record.mark_processed()
        logger.info(f"Successfully processed event {stripe_event_id}: {event_type}")
        return True

    except Exception as e:
        logger.error(f"Error processing event {stripe_event_id}: {str(e)}")
        event_record.mark_failed(str(e))
        return False


def handle_subscription_created(data: dict):
    """Handle customer.subscription.created event."""
    subscription = data.get("object", {})

    customer_id = subscription.get("customer")
    subscription_id = subscription.get("id")
    status = subscription.get("status")
    current_period_end = subscription.get("current_period_end")

    # Find and update StripeCustomer
    stripe_customer = StripeCustomer.objects.filter(
        stripe_customer_id=customer_id
    ).first()

    if not stripe_customer:
        logger.error(f"No StripeCustomer found for customer {customer_id}")
        return

    stripe_customer.stripe_subscription_id = subscription_id
    stripe_customer.subscription_status = status
    stripe_customer.subscription_current_period_end = (
        current_period_end if current_period_end else None
    )
    stripe_customer.save()

    # Update company status
    company = stripe_customer.company
    company.status = Company.StatusChoices.ACTIVE
    company.save()

    logger.info(f"Subscription {subscription_id} activated for company {company.id}")


def handle_subscription_updated(data: dict):
    """Handle customer.subscription.updated event."""
    subscription = data.get("object", {})

    customer_id = subscription.get("customer")
    subscription_id = subscription.get("id")
    status = subscription.get("status")
    current_period_end = subscription.get("current_period_end")

    stripe_customer = StripeCustomer.objects.filter(
        stripe_customer_id=customer_id
    ).first()

    if not stripe_customer:
        logger.error(f"No StripeCustomer found for customer {customer_id}")
        return

    stripe_customer.stripe_subscription_id = subscription_id
    stripe_customer.subscription_status = status
    stripe_customer.subscription_current_period_end = (
        current_period_end if current_period_end else None
    )
    stripe_customer.save()

    # Handle status changes
    if status == "past_due":
        company = stripe_customer.company
        company.status = Company.StatusChoices.SUSPENDED
        company.save()

    logger.info(f"Subscription {subscription_id} updated: status={status}")


def handle_subscription_deleted(data: dict):
    """Handle customer.subscription.deleted event."""
    subscription = data.get("object", {})

    customer_id = subscription.get("customer")

    stripe_customer = StripeCustomer.objects.filter(
        stripe_customer_id=customer_id
    ).first()

    if not stripe_customer:
        logger.error(f"No StripeCustomer found for customer {customer_id}")
        return

    company = stripe_customer.company
    company.status = Company.StatusChoices.CANCELLED
    company.save()

    stripe_customer.subscription_status = "canceled"
    stripe_customer.save()

    logger.info(f"Subscription deleted for company {company.id}")


def handle_invoice_payment_succeeded(data: dict):
    """Handle invoice.payment_succeeded event."""
    invoice = data.get("object", {})

    customer_id = invoice.get("customer")
    subscription_id = invoice.get("subscription")
    amount_paid = invoice.get("amount_paid", 0)

    stripe_customer = StripeCustomer.objects.filter(
        stripe_customer_id=customer_id
    ).first()

    if not stripe_customer:
        logger.warning(f"No StripeCustomer found for customer {customer_id}")
        return

    # Reactivate company if it was suspended
    company = stripe_customer.company
    if company.status == Company.StatusChoices.SUSPENDED:
        company.status = Company.StatusChoices.ACTIVE
        company.save()

    logger.info(
        f"Payment succeeded for company {company.id}: "
        f"amount={amount_paid},subscription={subscription_id}"
    )


def handle_invoice_payment_failed(data: dict):
    """Handle invoice.payment_failed event."""
    invoice = data.get("object", {})

    customer_id = invoice.get("customer")
    subscription_id = invoice.get("subscription")
    amount_due = invoice.get("amount_due", 0)
    invoice_pdf = invoice.get("invoice_pdf", "")

    stripe_customer = StripeCustomer.objects.filter(
        stripe_customer_id=customer_id
    ).first()

    if not stripe_customer:
        logger.warning(f"No StripeCustomer found for customer {customer_id}")
        return

    # Suspend company
    company = stripe_customer.company
    company.status = Company.StatusChoices.SUSPENDED
    company.save()

    logger.warning(
        f"Payment failed for company {company.id}: "
        f"amount_due={amount_due}, subscription={subscription_id}"
    )

    # TODO: Send notification to company about payment failure