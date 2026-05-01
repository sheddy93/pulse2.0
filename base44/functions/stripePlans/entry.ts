import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, plan } = await req.json();

    if (action === 'sync_to_stripe') {
      // Create or update Stripe product + prices for a plan
      let productId = plan.stripe_product_id;

      if (!productId) {
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description || plan.name,
          metadata: { base44_plan_id: plan.id, base44_app_id: Deno.env.get("BASE44_APP_ID") }
        });
        productId = product.id;
      } else {
        await stripe.products.update(productId, {
          name: plan.name,
          description: plan.description || plan.name,
        });
      }

      let monthlyPriceId = plan.stripe_price_monthly_id;
      let yearlyPriceId = plan.stripe_price_yearly_id;

      // Create monthly price
      if (plan.price_monthly > 0) {
        const monthlyPrice = await stripe.prices.create({
          product: productId,
          unit_amount: Math.round(plan.price_monthly * 100),
          currency: 'eur',
          recurring: { interval: 'month' },
          metadata: { base44_plan_id: plan.id, billing: 'monthly' }
        });
        monthlyPriceId = monthlyPrice.id;
      }

      // Create yearly price
      if (plan.price_yearly > 0) {
        const yearlyPrice = await stripe.prices.create({
          product: productId,
          unit_amount: Math.round(plan.price_yearly * 100),
          currency: 'eur',
          recurring: { interval: 'year' },
          metadata: { base44_plan_id: plan.id, billing: 'yearly' }
        });
        yearlyPriceId = yearlyPrice.id;
      }

      // Update plan in DB
      await base44.asServiceRole.entities.SubscriptionPlan.update(plan.id, {
        stripe_product_id: productId,
        stripe_price_monthly_id: monthlyPriceId,
        stripe_price_yearly_id: yearlyPriceId,
      });

      console.log(`Plan ${plan.name} synced to Stripe: product=${productId}`);
      return Response.json({ success: true, productId, monthlyPriceId, yearlyPriceId });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('stripePlans error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});