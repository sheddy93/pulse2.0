import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event;
    if (webhookSecret && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    console.log(`Stripe webhook event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};
      
      if (meta.plan_id && meta.user_email) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Find existing subscription record
        const existing = await base44.asServiceRole.entities.CompanySubscription.filter({ company_email: meta.user_email });
        // Estrai gli add-ons dal metadato
        let selectedAddons = [];
        if (meta.selected_addons) {
          try {
            selectedAddons = JSON.parse(meta.selected_addons);
          } catch (e) {
            console.log('Could not parse selected_addons from metadata');
          }
        }

        const subData = {
          company_email: meta.user_email,
          company_id: meta.company_id || '',
          plan_id: meta.plan_id,
          plan_name: meta.plan_name || '',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          stripe_price_id: subscription.items.data[0]?.price.id,
          billing_interval: meta.billing_interval || 'monthly',
          status: subscription.status,
          amount: subscription.items.data[0]?.price.unit_amount / 100,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          selected_addons: selectedAddons
        };

        if (existing[0]) {
          await base44.asServiceRole.entities.CompanySubscription.update(existing[0].id, subData);
        } else {
          await base44.asServiceRole.entities.CompanySubscription.create(subData);
        }
        console.log(`Subscription created/updated for ${meta.user_email}`);
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const existing = await base44.asServiceRole.entities.CompanySubscription.filter({ stripe_subscription_id: subscription.id });
      if (existing[0]) {
        await base44.asServiceRole.entities.CompanySubscription.update(existing[0].id, {
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        });
        console.log(`Subscription ${subscription.id} updated to ${subscription.status}`);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
});