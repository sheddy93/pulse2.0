import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customer_id } = await req.json();

    if (!customer_id) {
      return Response.json({ error: 'customer_id is required' }, { status: 400 });
    }

    // Fetch invoices from Stripe for this customer
    const invoices = await stripe.invoices.list({
      customer: customer_id,
      limit: 24 // Last 2 years (approximately)
    });

    // Format invoices for display
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      created: invoice.created,
      total: invoice.total,
      status: invoice.status,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      paid_at: invoice.paid_at,
      pdf_url: invoice.pdf
    })).sort((a, b) => b.created - a.created);

    console.log(`Payment history retrieved for customer ${customer_id}: ${formattedInvoices.length} invoices`);
    return Response.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('stripePaymentHistory error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});