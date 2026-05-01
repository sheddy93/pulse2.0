/**
 * Send Signature Reminder with Validation
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const validateReminder = (data) => {
  if (!data.document_id || !data.document_id.match(/^[a-f0-9-]{36}$/)) {
    throw new Error('Invalid document_id format');
  }
  if (!data.recipient_email || !data.recipient_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new Error('Invalid recipient_email format');
  }
  if (!data.recipient_name || data.recipient_name.trim().length === 0) {
    throw new Error('Invalid recipient_name');
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
    
    try {
      validateReminder(payload);
    } catch (validationError) {
      console.error('[Reminder] Validation error:', validationError.message);
      return Response.json({ error: validationError.message }, { status: 400 });
    }

    const { document_id, recipient_email, recipient_name } = payload;

    const docs = await base44.entities.Document.filter({ id: document_id });
    if (!docs.length) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = docs[0];

    // Send email
    await base44.integrations.Core.SendEmail({
      to: recipient_email,
      subject: `Promemoria: Firma richiesta per ${doc.title}`,
      body: `Caro ${recipient_name}, ti ricordiamo che devi firmare il documento "${doc.title}". Accedi alla piattaforma per completare l'azione.`
    });

    console.log(`[Reminder] Sent to ${recipient_email} for doc ${document_id}`);

    return Response.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[Reminder Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});