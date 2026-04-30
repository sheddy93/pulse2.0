"""
Stripe Billing API Views for PulseHR

This module provides API endpoints for Stripe billing integration:
- POST /api/billing/create-customer/ - Create Stripe customer (super_admin only)
- POST /api/billing/create-subscription/ - Create subscription for company
- POST /api/billing/cancel/ - Cancel subscription
- POST /api/webhooks/stripe/ - Stripe webhook receiver
- GET /api/billing/status/ - Get billing status
"""

import logging

import stripe
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import Company, StripeCustomer, User
from users.permissions import IsSuperAdmin
from users.serializers import CompanySerializer
from users.stripe_services import (
    cancel_subscription as cancel_sub,
    create_stripe_customer as create_stripe_cust,
    create_subscription as create_sub,
    get_or_create_stripe_customer,
    get_subscription_status,
    handle_webhook,
    update_subscription_status,
)

logger = logging.getLogger(__name__)


class StripeCustomerCreateView(APIView):
    """
    Create a Stripe customer for a company.
    Only accessible by super_admin.
    """

    permission_classes = [IsSuperAdmin]

    def post(self, request):
        """Create Stripe customer for a company."""
        company_id = request.data.get("company_id")
        email = request.data.get("email")

        if not company_id:
            return Response(
                {"error": "company_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get company
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return Response(
                {"error": "Company not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get email from request or company
        if not email:
            email = company.contact_email or request.user.email

        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if customer already exists
        stripe_customer = StripeCustomer.objects.filter(company=company).first()
        if stripe_customer and stripe_customer.stripe_customer_id:
            return Response(
                {"error": "Stripe customer already exists for this company"},
                {"stripe_customer_id": stripe_customer.stripe_customer_id},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create Stripe customer
        try:
            customer_id = create_stripe_cust(company, email)

            # Create or update StripeCustomer record
            stripe_customer, created = StripeCustomer.objects.get_or_create(
                company=company,
                defaults={"stripe_customer_id": customer_id}
            )
            if not created:
                stripe_customer.stripe_customer_id = customer_id
                stripe_customer.save()

            logger.info(f"Created Stripe customer {customer_id} for company {company.id}")

            return Response({
                "success": True,
                "stripe_customer_id": customer_id,
                "company": CompanySerializer(company).data,
            }, status=status.HTTP_201_CREATED)

        except stripe.StripeError as e:
            logger.error(f"Stripe error creating customer: {str(e)}")
            return Response(
                {"error": f"Stripe error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error creating Stripe customer: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StripeSubscriptionCreateView(APIView):
    """
    Create a subscription for a company.
    Accessible by super_admin, company_owner, company_admin.
    """

    def post(self, request):
        """Create subscription for a company."""
        company_id = request.data.get("company_id")
        plan = request.data.get("plan", "starter")  # starter, professional, enterprise

        if not company_id:
            return Response(
                {"error": "company_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get company
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return Response(
                {"error": "Company not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check permissions (only super_admin or company operators)
        user = request.user
        is_super = user.is_platform_admin if hasattr(user, 'is_platform_admin') else False
        is_company_op = user.company_id == company_id if hasattr(user, 'company_id') else False

        if not is_super and not is_company_op:
            return Response(
                {"error": "Not authorized to create subscription for this company"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get Stripe customer
        stripe_customer = get_or_create_stripe_customer(company)
        if not stripe_customer.stripe_customer_id:
            return Response(
                {"error": "Stripe customer not created yet. Call create-customer first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get price ID from settings based on plan
        price_ids = getattr(settings, 'STRIPE_PRICE_IDS', {})
        price_id = price_ids.get(plan)

        if not price_id:
            return Response(
                {"error": f"Invalid plan: {plan}. Available plans: {list(price_ids.keys())}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create subscription
        try:
            subscription_id = create_sub(
                stripe_customer.stripe_customer_id,
                price_id,
                company
            )

            # Update StripeCustomer with subscription ID
            subscription_data = get_subscription_status(subscription_id)
            update_subscription_status(stripe_customer, subscription_data)

            # Update company plan
            company.plan = plan
            company.save()

            return Response({
                "success": True,
                "subscription_id": subscription_id,
                "status": subscription_data.get("status"),
                "plan": plan,
            }, status=status.HTTP_201_CREATED)

        except stripe.StripeError as e:
            logger.error(f"Stripe error creating subscription: {str(e)}")
            return Response(
                {"error": f"Stripe error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error creating subscription: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StripeSubscriptionCancelView(APIView):
    """
    Cancel a company's subscription.
    Accessible by super_admin only.
    """

    permission_classes = [IsSuperAdmin]

    def post(self, request):
        """Cancel subscription for a company."""
        company_id = request.data.get("company_id")

        if not company_id:
            return Response(
                {"error": "company_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get company
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return Response(
                {"error": "Company not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get Stripe customer
        stripe_customer = StripeCustomer.objects.filter(company=company).first()
        if not stripe_customer or not stripe_customer.stripe_subscription_id:
            return Response(
                {"error": "No active subscription found for this company"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cancel subscription
        try:
            result = cancel_sub(stripe_customer.stripe_subscription_id)

            # Update company status
            company.status = Company.StatusChoices.CANCELLED
            company.save()

            # Update stripe customer
            stripe_customer.subscription_status = "canceled"
            stripe_customer.save()

            return Response({
                "success": True,
                "message": "Subscription cancelled",
                "details": result,
            }, status=status.HTTP_200_OK)

        except stripe.StripeError as e:
            logger.error(f"Stripe error cancelling subscription: {str(e)}")
            return Response(
                {"error": f"Stripe error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error cancelling subscription: {str(e)}")
            return Response(
                {"error": str(e)},
status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StripeWebhookView(APIView):
    """
    Receive and process Stripe webhook events.
    No authentication - Stripe signature is verified instead.
    """

    permission_classes = [AllowAny]  # Webhooks use signature verification

    def post(self, request):
        """Handle incoming Stripe webhook."""
        # Get Stripe signature from headers
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        if not sig_header:
            logger.warning("Webhook received without Stripe signature")
            return Response(
                {"error": "Missing Stripe signature"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify webhook signature
        webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)
        if not webhook_secret:
            logger.error("STRIPE_WEBHOOK_SECRET not configured")
            return Response(
                {"error": "Webhook secret not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            event = stripe.Webhook.construct_event(
                payload,
                sig_header,
                webhook_secret
            )
        except ValueError:
            logger.error("Invalid payload in webhook")
            return Response(
                {"error": "Invalid payload"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except stripe.SignatureVerificationError:
            logger.error("Invalid signature in webhook")
            return Response(
                {"error": "Invalid signature"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extract event data
        event_type = event.get("type", "")
        event_id = event.get("id", "")
        data= event.get("data", {})

        logger.info(f"Processing webhook: {event_type} (ID: {event_id})")

        # Process the webhook
        success = handle_webhook(event_type, data, event_id)

        if success:
            return Response({"received": True}, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Event processing failed"},
                status=status.HTTP_400_BAD_REQUEST
            )


class StripeBillingStatusView(APIView):
    """
    Get billing status for a company.
    Accessible by company users.
    """

    def get(self, request):
        """Get billing status for the current user's company."""
        user = request.user

        # Get company from user
        company = None
        if hasattr(user, 'company') and user.company:
            company = user.company
        elif user.is_platform_admin:
            # Super admin can check any company
            company_id = request.query_params.get("company_id")
            if company_id:
                try:
                    company = Company.objects.get(id=company_id)
                except Company.DoesNotExist:
                    return Response(
                        {"error": "Company not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )

        if not company:
            return Response(
                {"error": "No company associated with user"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get Stripe customer
        stripe_customer = StripeCustomer.objects.filter(company=company).first()

        if not stripe_customer:
            return Response({
                "has_stripe_customer": False,
                "company": CompanySerializer(company).data,
                "status": "no_billing",
            })

        # Get subscription details if available
        subscription_data = None
        if stripe_customer.stripe_subscription_id:
            try:
                subscription_data = get_subscription_status(
                    stripe_customer.stripe_subscription_id
                )
            except stripe.StripeError as e:
                logger.warning(f"Could not retrieve subscription status: {str(e)}")

        return Response({
            "has_stripe_customer": True,
            "stripe_customer_id": stripe_customer.stripe_customer_id,
            "stripe_subscription_id": stripe_customer.stripe_subscription_id,
            "subscription_status": stripe_customer.subscription_status,
            "subscription_current_period_end": stripe_customer.subscription_current_period_end,
            "subscription_details": subscription_data,
            "company": CompanySerializer(company).data,
            "status": "active" if stripe_customer.subscription_status == "active" else "inactive",
        })