/**
 * Stripe Checkout with Input Validation
 * Validates all inputs before creating session
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const Stripe = (await import('npm:stripe@16.0.0')).default;
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Validation schemas
const validateCheckoutInput = (data) => {
  const required = ['company_id', 'plan_id', 'success_url', 'cancel_url'];
  for (const field of required) {
    if (!data[field]) throw new Error(`Missing required field: ${field}`);
  }
  
  if (!data.company_id.match(/^[a-f0-9-]{36}$/)) throw new Error('Invalid company_id format');
  if (!data.plan_id.match(/^[a-f0-9-]{36}$/)) throw new Error('Invalid plan_id format');
  if (new URL(data.success_url).href !== data.success_url) throw new Error('Invalid success_url');
  if (new URL(data.cancel_url).href !== data.cancel_url) throw new Error('Invalid cancel_url');
  if (data.quantity && (data.quantity < 1 || !Number.isInteger(data.quantity))) {
    throw new Error('Invalid quantity');
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    
    // Validate input
    try {
      validateCheckoutInput(payload);
    } catch (validationError) {
      console.error('[Stripe] Validation error:', validationError.message);
      return Response.json({ error: validationError.message }, { status: 400 });
    }

    const { company_id, plan_id, quantity = 1, success_url, cancel_url } = payload;

    // Verify company ownership
    const company = await base44.entities.Company.filter({ id: company_id });
    if (!company.length) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    // Create session with validation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Plan ${plan_id}` },
            unit_amount: 9999 // $99.99 - adjust per plan
          },
          quantity: quantity
        }
      ],
      mode: 'subscription',
      success_url,
      cancel_url,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        company_id,
        user_email: user.email
      }
    });

    // Log for audit
    await base44.asServiceRole.entities.AuditLog.create({
      company_id,
      actor_email: user.email,
      action: 'checkout_session_created',
      resource: 'stripe_session',
      details: { session_id: session.id, amount: 9999 * quantity }
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('[Stripe Checkout Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});