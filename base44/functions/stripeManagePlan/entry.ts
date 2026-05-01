import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, subscription_id, plan_id, company_id } = await req.json();

    if (action === 'create_plan') {
      // Admin only
      if (user.role !== 'super_admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const { name, description, price_monthly, max_employees, features, is_popular, color, sort_order } = await req.json().catch(() => ({}));
      // This is called separately - handled in stripeAdminPlans
    }

    if (action === 'cancel') {
      const sub = await stripe.subscriptions.update(subscription_id, { cancel_at_period_end: true });
      const subs = await base44.asServiceRole.entities.CompanySubscription.filter({ stripe_subscription_id: subscription_id });
      if (subs[0]) {
        await base44.asServiceRole.entities.CompanySubscription.update(subs[0].id, { cancel_at_period_end: true });
      }
      return Response.json({ success: true, subscription: sub });
    }

    if (action === 'reactivate') {
      const sub = await stripe.subscriptions.update(subscription_id, { cancel_at_period_end: false });
      const subs = await base44.asServiceRole.entities.CompanySubscription.filter({ stripe_subscription_id: subscription_id });
      if (subs[0]) {
        await base44.asServiceRole.entities.CompanySubscription.update(subs[0].id, { cancel_at_period_end: false });
      }
      return Response.json({ success: true, subscription: sub });
    }

    if (action === 'portal') {
      const companies = await base44.asServiceRole.entities.Company.filter({ owner_email: user.email });
      const company = companies[0];
      const subs = await base44.asServiceRole.entities.CompanySubscription.filter({ company_id: company?.id });
      if (!subs[0]?.stripe_customer_id) return Response.json({ error: 'Nessun abbonamento trovato' }, { status: 404 });

      const session = await stripe.billingPortal.sessions.create({
        customer: subs[0].stripe_customer_id,
        return_url: `${req.headers.get('origin')}/dashboard/company/subscription`
      });
      return Response.json({ url: session.url });
    }

    return Response.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (error) {
    console.error('stripeManagePlan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});