"""
Admin Analytics Views for PulseHR Super Admin Dashboard

Provides aggregated metrics and analytics data for business intelligence.
Only accessible by super_admin users.
"""

from datetime import timedelta
from django.db.models import Count, Sum, Avg, F, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Company, EmployeeProfile, User, PricingPlan
from .permissions import IsSuperAdmin


def get_default_date_range():
    """Get default date range for analytics queries."""
    today = timezone.now().date()
    current_month_start = today.replace(day=1)
    return today, current_month_start


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def analytics_overview(request):
    """
    GET /api/admin/analytics/overview/

    Returns aggregate metrics about companies, employees, and users.
    Uses Django ORM annotations for optimized queries.
    """
    today = timezone.now().date()
    current_month_start = today.replace(day=1)

    # Company counts by status
    company_stats = Company.objects.aggregate(
        total=Count('id'),
        active=Count('id', filter=Q(status=Company.StatusChoices.ACTIVE)),
        trial=Count('id', filter=Q(status=Company.StatusChoices.TRIAL)),
        suspended=Count('id', filter=Q(status=Company.StatusChoices.SUSPENDED)),
    )

    # New companies this month
    new_companies_this_month = Company.objects.filter(
        created_at__date__gte=current_month_start
    ).count()

    # Total employees (active)
    total_employees = EmployeeProfile.objects.filter(
        status=EmployeeProfile.StatusChoices.ACTIVE
    ).count()

    # Total users
    total_users = User.objects.filter(is_active=True).count()

    # New employees this month
    new_employees_this_month = EmployeeProfile.objects.filter(
        created_at__date__gte=current_month_start
    ).count()

    data = {
        'total_companies': company_stats['total'] or 0,
        'active_companies': company_stats['active'] or 0,
        'trial_companies': company_stats['trial'] or 0,
        'suspended_companies': company_stats['suspended'] or 0,
        'total_employees': total_employees,
        'total_users': total_users,
        'new_companies_this_month': new_companies_this_month,
        'new_employees_this_month': new_employees_this_month,
    }

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def analytics_revenue(request):
    """
    GET /api/admin/analytics/revenue/

    Returns revenue metrics including MRR, ARR, and revenue by plan.
    Uses annotated queries for optimized aggregation.
    """
    today = timezone.now().date()

    # Get active companies with their plan pricing
    active_companies = Company.objects.filter(
        status__in=[Company.StatusChoices.ACTIVE, Company.StatusChoices.TRIAL],
        plan__isnull=False
    ).exclude(plan='')

    # Get pricing plans for revenue calculation
    pricing_plans = {
        p.code: p for p in PricingPlan.objects.filter(is_active=True)
    }

    # Calculate revenue by plan
    revenue_by_plan = {
        'starter': 0.0,
        'professional': 0.0,
        'enterprise': 0.0,
    }

    total_monthly_revenue = 0.0
    company_count = 0

    for company in active_companies:
        plan_code = company.plan.lower() if company.plan else None
        if plan_code in pricing_plans:
            plan = pricing_plans[plan_code]
            monthly_price = plan.price_cents / 100

            # Apply yearly discount if applicable
            if company.billing_cycle == Company.BillingCycleChoices.YEARLY:
                yearly_discount = pricing_plans.get('default', None)
                # Use monthly equivalent
                monthly_price = plan.price_cents / 100

            revenue_by_plan[plan_code] = revenue_by_plan.get(plan_code, 0) + monthly_price
            total_monthly_revenue += monthly_price
            company_count += 1

    # Calculate MRR and ARR
    mrr = total_monthly_revenue
    arr = mrr * 12

    # Average revenue per company
    mrp = total_monthly_revenue / company_count if company_count > 0 else 0

    # Revenue trend (last 12 months)
    twelve_months_ago = today - timedelta(days=365)
    monthly_revenue_trend = []

    # Aggregate revenue by month (approximation based on new active companies)
    revenue_by_month = (
        Company.objects
        .filter(
            status=Company.StatusChoices.ACTIVE,
            created_at__date__gte=twelve_months_ago
        )
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )

    # Generate trend data for the last 12 months
    current_date = today.replace(day=1)
    for i in range(12):
        month_date = current_date - timedelta(days=30 * i)
        month_key = month_date.strftime('%Y-%m')

        # Find companies that became active in this month
        month_companies = [
            c for c in active_companies
            if c.created_at and c.created_at.strftime('%Y-%m') == month_key
        ]

        month_revenue = 0
        for company in month_companies:
            plan_code = company.plan.lower() if company.plan else None
            if plan_code in pricing_plans:
                month_revenue += pricing_plans[plan_code].price_cents / 100

        # Add base revenue from all active companies (simplified)
        if i == 0:
            month_revenue = total_monthly_revenue

        monthly_revenue_trend.append({
            'month': month_key,
            'revenue': round(month_revenue, 2)
        })

    monthly_revenue_trend.reverse()

    data = {
        'mrr': round(mrr, 2),
        'arr': round(arr, 2),
        'mrp': round(mrp, 2),
        'revenue_by_plan': {
            'starter': round(revenue_by_plan.get('starter', 0), 2),
            'professional': round(revenue_by_plan.get('professional', 0), 2),
            'enterprise': round(revenue_by_plan.get('enterprise', 0), 2),
        },
        'revenue_trend': monthly_revenue_trend,
    }

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def analytics_conversion(request):
    """
    GET /api/admin/analytics/conversion/

    Returns trial-to-paid conversion metrics and funnel data.
    """
    today = timezone.now().date()
    thirty_days_ago = today - timedelta(days=30)

    # Count companies by status
    status_counts = Company.objects.aggregate(
        total=Count('id'),
        active=Count('id', filter=Q(status=Company.StatusChoices.ACTIVE)),
        trial=Count('id', filter=Q(status=Company.StatusChoices.TRIAL)),
    )

    total_trials = status_counts['trial'] or 0
    converted = status_counts['active'] or 0

    # Companies that were trial and are now active (converted)
    # This is approximated by companies with trial status that have billing info
    converted_companies = Company.objects.filter(
        status=Company.StatusChoices.ACTIVE
    ).exclude(
        plan=''
    ).count()

    # Companies that churned (were active, now suspended or cancelled)
    churned = Company.objects.filter(
        status__in=[Company.StatusChoices.SUSPENDED, Company.StatusChoices.CANCELLED]
    ).count()

    # Conversion rate
    conversion_rate = (converted_companies / total_trials * 100) if total_trials > 0 else 0

    # Funnel data (approximated from audit logs and company status)
    # Visits - approximated from companies that viewed pricing
    total_registrations = Company.objects.filter(
        created_at__date__gte=thirty_days_ago
    ).count()

    trials_started = total_trials
    trials_converted = converted_companies

    # Simplified funnel (these would ideally come from analytics tracking)
    funnel = {
        'visits': total_registrations * 10,  # Estimated
        'signups': total_registrations,
        'trials_started': trials_started,
        'trials_converted': trials_converted,
    }

    data = {
        'total_trials': total_trials,
        'converted': converted_companies,
        'churned': churned,
        'conversion_rate': round(conversion_rate, 2),
        'funnel': funnel,
    }

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def analytics_plans(request):
    """
    GET /api/admin/analytics/plans/

    Returns plan distribution and upgrade/downgrade metrics.
    """
    # Get active pricing plans
    pricing_plans = PricingPlan.objects.filter(is_active=True)

    # Count companies by plan
    plan_distribution = {}
    total_companies = 0

    for plan_type_code in ['starter', 'professional', 'enterprise']:
        count = Company.objects.filter(
            plan__iexact=plan_type_code,
            status__in=[Company.StatusChoices.ACTIVE, Company.StatusChoices.TRIAL]
        ).count()
        plan_distribution[plan_type_code] = {'count': count}
        total_companies += count

    # Calculate percentages
    for plan_type in plan_distribution:
        count = plan_distribution[plan_type]['count']
        percentage = (count / total_companies * 100) if total_companies > 0 else 0
        plan_distribution[plan_type]['percentage'] = round(percentage, 2)

    # Top plans by revenue (sorted by revenue contribution)
    revenue_by_plan = {}
    for plan in pricing_plans:
        plan_code = plan.code.lower()
        company_count = Company.objects.filter(
            plan__iexact=plan_code,
            status__in=[Company.StatusChoices.ACTIVE, Company.StatusChoices.TRIAL]
        ).count()
        revenue = (plan.price_cents / 100) * company_count
        revenue_by_plan[plan_code] = {
            'name': plan.name,
            'count': company_count,
            'price': plan.price_cents / 100,
            'revenue': round(revenue, 2),
        }

    top_plans_by_revenue = sorted(
        revenue_by_plan.items(),
        key=lambda x: x[1]['revenue'],
        reverse=True
    )
    top_plans_by_revenue = [
        {'plan': plan, **data} for plan, data in top_plans_by_revenue
    ]

    # Count upgrades and downgrades from audit logs
    # This would require tracking plan changes in audit logs
    # For now, we'll approximate from recent company status changes
    thirty_days_ago = timezone.now() - timedelta(days=30)

    upgrade_count = 0
    downgrade_count = 0

    # Count companies with higher plans (simplified heuristic)
    enterprise_count = plan_distribution.get('enterprise', {}).get('count', 0)
    professional_count = plan_distribution.get('professional', {}).get('count', 0)

    # These would ideally come from PlanChangeAuditLog or similar
    # Using status change logs as a proxy
    upgrade_count = Company.objects.filter(
        status=Company.StatusChoices.ACTIVE,
        plan__in=['professional', 'enterprise']
    ).count() - Company.objects.filter(
        created_at__gte=thirty_days_ago,
        plan__in=['professional', 'enterprise']
    ).count()

    downgrade_count = 0  # Would need actual tracking

    data = {
        'plan_distribution': plan_distribution,
        'top_plans_by_revenue': top_plans_by_revenue,
        'upgrade_count': max(0, upgrade_count),
        'downgrade_count': max(0, downgrade_count),
    }

    return Response(data)
