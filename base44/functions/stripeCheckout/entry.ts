import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { price_id, plan_id, plan_name, billing_interval, success_url, cancel_url, selected_addons, company_id } = await req.json();

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

    // Costruisci line items con piano base + add-ons
    const lineItems = [{ price: price_id, quantity: 1 }];
    
    // Se ci sono add-ons, crea prodotti one-time per ogni add-on
    if (selected_addons && selected_addons.length > 0) {
      for (const addon of selected_addons) {
        // In un caso reale, avresti prodotti e prezzi Stripe per ogni add-on
        // Per ora, aggiungiamo come line items custom
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${addon.addon_name} × ${addon.quantity}`,
            },
            unit_amount: Math.round(addon.total_price * 100),
            recurring: {
              interval: billing_interval === 'yearly' ? 'year' : 'month',
              interval_count: 1,
            }
          },
          quantity: 1,
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: lineItems,
      success_url: success_url || `${req.headers.get('origin')}/dashboard/company/subscription?success=true`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/dashboard/company/subscription?canceled=true`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        plan_id,
        plan_name,
        billing_interval,
        user_email: user.email,
        company_id: company_id || user.company_id || '',
        selected_addons: JSON.stringify(selected_addons || [])
      }
    });

    console.log(`Checkout session created: ${session.id} for ${user.email}`);
    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('stripeCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});