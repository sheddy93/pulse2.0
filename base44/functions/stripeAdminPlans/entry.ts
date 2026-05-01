import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'super_admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { action } = body;

    if (action === 'create_plan') {
      const { name, description, price_monthly, max_employees, features, is_popular, color, sort_order } = body;

      // Create Stripe product
      const product = await stripe.products.create({
        name,
        description: description || '',
        metadata: { base44_app_id: Deno.env.get('BASE44_APP_ID') }
      });

      // Create Stripe price (monthly)
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price_monthly * 100),
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { base44_app_id: Deno.env.get('BASE44_APP_ID') }
      });

      // Save to DB
      const plan = await base44.asServiceRole.entities.SubscriptionPlan.create({
        name,
        description,
        price_monthly,
        max_employees: max_employees || 0,
        features: features || [],
        stripe_product_id: product.id,
        stripe_price_id: price.id,
        is_active: true,
        is_popular: is_popular || false,
        color: color || 'blue',
        sort_order: sort_order || 0
      });

      return Response.json({ success: true, plan });
    }

    if (action === 'update_plan') {
      const { plan_id, name, description, price_monthly, max_employees, features, is_popular, color, sort_order, is_active } = body;

      const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ id: plan_id });
      const plan = plans[0];
      if (!plan) return Response.json({ error: 'Piano non trovato' }, { status: 404 });

      // Update Stripe product
      if (plan.stripe_product_id) {
        await stripe.products.update(plan.stripe_product_id, { name, description: description || '' });
      }

      // If price changed, create new price and archive old one
      let stripe_price_id = plan.stripe_price_id;
      if (price_monthly !== plan.price_monthly && plan.stripe_product_id) {
        // Archive old price
        if (plan.stripe_price_id) {
          await stripe.prices.update(plan.stripe_price_id, { active: false });
        }
        // Create new price
        const newPrice = await stripe.prices.create({
          product: plan.stripe_product_id,
          unit_amount: Math.round(price_monthly * 100),
          currency: 'eur',
          recurring: { interval: 'month' }
        });
        stripe_price_id = newPrice.id;
      }

      const updated = await base44.asServiceRole.entities.SubscriptionPlan.update(plan_id, {
        name, description, price_monthly, max_employees, features, is_popular, color, sort_order, is_active, stripe_price_id
      });

      return Response.json({ success: true, plan: updated });
    }

    if (action === 'delete_plan') {
      const { plan_id } = body;
      const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ id: plan_id });
      const plan = plans[0];
      if (!plan) return Response.json({ error: 'Piano non trovato' }, { status: 404 });

      // Archive on Stripe
      if (plan.stripe_product_id) {
        await stripe.products.update(plan.stripe_product_id, { active: false });
      }
      await base44.asServiceRole.entities.SubscriptionPlan.update(plan_id, { is_active: false });
      return Response.json({ success: true });
    }

    if (action === 'list_subscriptions') {
      const subs = await base44.asServiceRole.entities.CompanySubscription.list('-created_date', 100);
      return Response.json({ subscriptions: subs });
    }

    if (action === 'sync_stripe') {
      // Sync subscription status from Stripe
      const subs = await base44.asServiceRole.entities.CompanySubscription.list('-created_date', 100);
      const results = [];
      for (const sub of subs) {
        if (sub.stripe_subscription_id) {
          try {
            const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
            await base44.asServiceRole.entities.CompanySubscription.update(sub.id, {
              status: stripeSub.status,
              current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
              cancel_at_period_end: stripeSub.cancel_at_period_end
            });
            results.push({ id: sub.id, status: stripeSub.status });
          } catch (e) {
            console.error('sync error for sub:', sub.id, e.message);
          }
        }
      }
      return Response.json({ success: true, synced: results.length });
    }

    return Response.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (error) {
    console.error('stripeAdminPlans error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});