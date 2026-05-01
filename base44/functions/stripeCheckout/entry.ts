import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const stripe = await import('npm:stripe@17.0.0').then(m => new m.default(Deno.env.get('STRIPE_SECRET_KEY')));

// Rate limiting helper
const checkRateLimit = async (base44, identifier, endpoint, maxRequests = 10, windowMinutes = 60) => {
  const now = new Date();
  const records = await base44.entities.ApiRateLimit.filter({ identifier, endpoint });
  
  if (records.length === 0) {
    await base44.entities.ApiRateLimit.create({
      identifier,
      endpoint,
      request_count: 1,
      window_start: now.toISOString(),
      max_requests: maxRequests,
      window_size_minutes: windowMinutes
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const record = records[0];
  const windowStart = new Date(record.window_start);
  const windowEnd = new Date(windowStart.getTime() + windowMinutes * 60000);

  if (now > windowEnd) {
    await base44.entities.ApiRateLimit.update(record.id, {
      request_count: 1,
      window_start: now.toISOString()
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.is_blocked) {
    const blockedUntil = new Date(record.blocked_until);
    return { allowed: now >= blockedUntil, remaining: 0 };
  }

  const newCount = record.request_count + 1;
  if (newCount > maxRequests) {
    await base44.entities.ApiRateLimit.update(record.id, {
      is_blocked: true,
      blocked_until: new Date(now.getTime() + 15 * 60000).toISOString()
    });
    return { allowed: false, remaining: 0 };
  }

  await base44.entities.ApiRateLimit.update(record.id, { request_count: newCount });
  return { allowed: true, remaining: maxRequests - newCount };
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: max 10 checkout per ora
    const rateLimit = await checkRateLimit(base44, user.email, 'stripeCheckout', 10, 60);
    if (!rateLimit.allowed) {
      return Response.json({ error: 'Too many checkout attempts. Try again later.' }, { status: 429 });
    }

    const payload = await req.json();
    const { price_id, plan_id, plan_name, billing_interval, selected_addons, company_id } = payload;

    if (!price_id || !plan_id) {
      console.error('Missing required fields:', { price_id, plan_id });
      return Response.json({ error: 'Missing price_id or plan_id' }, { status: 400 });
    }

    // Calcola add-ons totali
    const addonsPrice = selected_addons.reduce((sum, addon) => sum + (addon.total_price || 0), 0);
    const addonsAmount = Math.round(addonsPrice * 100); // Converti a centesimi

    // Crea o trova il cliente Stripe
    let customerId = null;

    // Prova a trovare un cliente Stripe esistente per questa azienda
    if (company_id) {
      const subscriptions = await base44.entities.CompanySubscription.filter({ company_id });
      if (subscriptions[0]?.stripe_customer_id) {
        customerId = subscriptions[0].stripe_customer_id;
      }
    }

    // Se non esiste, crea un nuovo cliente Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || 'Unknown',
        metadata: {
          company_id: company_id || 'N/A',
          user_email: user.email,
          base44_app_id: Deno.env.get('BASE44_APP_ID')
        }
      });
      customerId = customer.id;
      console.log(`Created Stripe customer: ${customerId}`);
    }

    // Crea item di checkout per il piano base
    const lineItems = [
      {
        price: price_id,
        quantity: 1
      }
    ];

    // Aggiungi add-ons come line items aggiuntivi se presenti
    if (selected_addons.length > 0) {
      for (const addon of selected_addons) {
        // Crea un prezzo dinamico per l'add-on
        const addonPrice = await stripe.prices.create({
          unit_amount: Math.round(addon.unit_price * 100), // Converti a centesimi
          currency: 'eur',
          recurring: {
            interval: billing_interval === 'yearly' ? 'year' : 'month'
          },
          metadata: {
            addon_id: addon.addon_id,
            addon_name: addon.addon_name,
            base44_app_id: Deno.env.get('BASE44_APP_ID')
          }
        });

        lineItems.push({
          price: addonPrice.id,
          quantity: addon.quantity
        });
      }
    }

    // Crea la sessione di checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      success_url: `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/dashboard/company/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/dashboard/company/pricing-plans?cancelled=true`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        company_id: company_id || 'N/A',
        plan_id: plan_id,
        plan_name: plan_name,
        user_email: user.email,
        addons_count: selected_addons.length
      }
    });

    console.log(`Checkout session created: ${session.id}`);

    return Response.json({
      url: session.url,
      session_id: session.id,
      customer_id: customerId
    });
  } catch (error) {
    console.error('Stripe checkout error:', error.message, error.stack);
    return Response.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
});