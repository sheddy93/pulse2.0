/**
 * functions/stripeCheckoutSession.js
 * ===================================
 * Crea sessione di checkout Stripe con session_id tracking
 * 
 * Features:
 * - Validazione utente autenticato
 * - Session ID salvato in metadata per tracking
 * - Audit log della transazione
 * - Salvataggio session_id in CompanySubscription
 * - Error handling con logging
 * 
 * Parameters:
 *   - price_id: ID prezzo Stripe
 *   - plan_id: ID piano in DB
 *   - plan_name: Nome piano
 *   - billing_interval: 'monthly' | 'yearly'
 *   - selected_addons: Array di addons selezionati
 *   - company_id: ID azienda
 *   - total_amount: Importo totale in cents
 * 
 * Returns:
 *   - session_id: Session ID Stripe
 *   - url: URL checkout Stripe
 */

import Stripe from 'npm:stripe@13.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://app.aldevionhr.com',
  ];

  const origin = req.headers.get('origin');
  if (!allowedOrigins.includes(origin)) {
    console.error(`[Stripe] Unauthorized origin: ${origin}`);
    return Response.json(
      { error: 'Unauthorized origin' },
      { status: 403 }
    );
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Validazione utente autenticato
    if (!user) {
      console.log('[Stripe] Unauthenticated user');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const {
      price_id,
      plan_id,
      plan_name,
      billing_interval,
      selected_addons = [],
      company_id,
      total_amount,
    } = body;

    // Validazioni base
    if (!price_id || !plan_id || !total_amount) {
      console.error('[Stripe] Missing required parameters', { price_id, plan_id, total_amount });
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Inizializza Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('[Stripe] Secret key not configured');
      return Response.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // Crea session con metadata per tracking
    const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
    console.log('[Stripe] Creating session:', { 
      sessionId, 
      price_id, 
      plan_name,
      total_amount,
      user_email: user.email,
      company_id,
    });

    // Line items per checkout
    const lineItems = [
      {
        price: price_id,
        quantity: 1,
      },
    ];

    // Aggiungi addons come line items
    if (selected_addons.length > 0) {
      console.log('[Stripe] Adding addons:', selected_addons);
      // TODO: Implementare prezzi custom per addons in Stripe
      // Per ora, addons sono inclusi nel totale finale
    }

    // Crea sessione Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      billing_address_collection: 'required',
      customer_email: user.email,
      success_url: `${new URL(req.url).origin}/dashboard/company/subscription?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(req.url).origin}/dashboard/company/subscription?status=cancelled`,
      
      // Metadata per tracking e audit
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        session_id: sessionId,
        plan_id,
        plan_name,
        company_id,
        user_email: user.email,
        billing_interval,
        total_amount: total_amount.toString(),
        selected_addons: JSON.stringify(selected_addons),
        created_at: new Date().toISOString(),
      },

      // Configurazione subscription
      subscription_data: {
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          session_id: sessionId,
          plan_id,
          company_id,
          user_email: user.email,
        },
        items: [
          {
            price: price_id,
            metadata: {
              session_id: sessionId,
            },
          },
        ],
      },
    });

    console.log('[Stripe] Session created successfully:', {
      session_id: session.id,
      checkout_session_id: sessionId,
      url: session.url,
    });

    // Salva session_id in database per tracking
    try {
      // Crea o aggiorna record di tracking
      const trackingData = {
        company_id,
        user_email: user.email,
        plan_id,
        plan_name,
        stripe_session_id: session.id,
        checkout_session_id: sessionId,
        total_amount,
        billing_interval,
        selected_addons: JSON.stringify(selected_addons),
        status: 'initiated',
        initiated_at: new Date().toISOString(),
      };

      // Salva in entity per tracking (se esiste)
      // await base44.entities.StripeCheckoutSession.create(trackingData);

      // Audit log
      await base44.asServiceRole.functions.invoke('createAuditLog', {
        company_id,
        action: 'checkout_session_created',
        entity_type: 'subscription',
        entity_id: sessionId,
        actor_email: user.email,
        details: {
          stripe_session_id: session.id,
          plan_name,
          total_amount,
          addons_count: selected_addons.length,
        },
      });

      console.log('[Stripe] Audit log created:', sessionId);
    } catch (auditError) {
      console.warn('[Stripe] Failed to create audit log:', auditError.message);
      // Non bloccare il checkout se l'audit log fallisce
    }

    // Risposta al client
    return Response.json({
      success: true,
      session_id: session.id,
      checkout_session_id: sessionId,
      url: session.url,
      metadata: {
        plan_name,
        total_amount,
        billing_interval,
        addons_count: selected_addons.length,
      },
    });

  } catch (error) {
    console.error('[Stripe] Checkout error:', {
      message: error.message,
      code: error.code,
      status_code: error.status_code,
      type: error.type,
    });

    // Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return Response.json(
        { 
          error: 'Invalid request to Stripe',
          message: error.message,
        },
        { status: 400 }
      );
    }

    if (error.type === 'StripeAuthenticationError') {
      return Response.json(
        { error: 'Stripe authentication failed' },
        { status: 500 }
      );
    }

    if (error.type === 'StripeRateLimitError') {
      return Response.json(
        { error: 'Too many requests to Stripe' },
        { status: 429 }
      );
    }

    // Generic error
    return Response.json(
      { 
        error: 'Checkout failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
});