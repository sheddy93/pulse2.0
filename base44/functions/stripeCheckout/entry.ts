import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { price_id, plan_id, plan_name, billing_interval, success_url, cancel_url } = await req.json();

    if (!price_id) return Response.json({ error: 'price_id is required' }, { status: 400 });

    // Get or create Stripe customer
    let customerId;
    const subs = await base44.asServiceRole.entities.CompanySubscription.filter({ company_email: user.email });
    if (subs[0]?.stripe_customer_id) {
      customerId = subs[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { base44_user_id: user.id, base44_app_id: Deno.env.get("BASE44_APP_ID") }
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: success_url || `${req.headers.get('origin')}/dashboard/company?subscription=success`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/dashboard/company?subscription=canceled`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        plan_id,
        plan_name,
        billing_interval,
        user_email: user.email,
        company_id: user.company_id || ''
      }
    });

    console.log(`Checkout session created: ${session.id} for ${user.email}`);
    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('stripeCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});