/**
 * Email Notifications Service
 * Invia email per eventi critici
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { event_type, recipient_email, subject, template, data } = payload;

    if (!recipient_email || !event_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Definisci template email
    const templates = {
      leave_request_submitted: {
        subject: 'Nuova richiesta di ferie',
        html: (data) => `
          <h2>Nuova richiesta di ferie</h2>
          <p>${data.employee_name} ha richiesto ferie dal ${data.start_date} al ${data.end_date}</p>
          <p><a href="${data.approval_link}">Accedi per approvare</a></p>
        `
      },
      leave_request_approved: {
        subject: 'Ferie approvate',
        html: (data) => `
          <h2>La tua richiesta di ferie è stata approvata!</h2>
          <p>Dal ${data.start_date} al ${data.end_date}</p>
        `
      },
      leave_request_rejected: {
        subject: 'Richiesta di ferie rifiutata',
        html: (data) => `
          <h2>La tua richiesta di ferie è stata rifiutata</h2>
          <p>Motivo: ${data.reason}</p>
        `
      },
      overtime_submitted: {
        subject: 'Nuova richiesta di straordinario',
        html: (data) => `
          <h2>Nuova richiesta di straordinario</h2>
          <p>${data.employee_name} ha richiesto ${data.hours} ore di straordinario il ${data.date}</p>
        `
      },
      document_requires_signature: {
        subject: 'Documento da firmare',
        html: (data) => `
          <h2>È richiesta la tua firma</h2>
          <p>Documento: ${data.document_name}</p>
          <p><a href="${data.signature_link}">Firma il documento</a></p>
        `
      },
      expense_submitted: {
        subject: 'Nuovo rimborso spese in attesa di approvazione',
        html: (data) => `
          <h2>Nuovo rimborso spese</h2>
          <p>€${data.amount} da ${data.employee_name}</p>
          <p><a href="${data.approval_link}">Accedi per approvare</a></p>
        `
      },
      subscription_expiring: {
        subject: 'Il tuo abbonamento scade tra 7 giorni',
        html: (data) => `
          <h2>Abbonamento in scadenza</h2>
          <p>Il tuo piano ${data.plan_name} scade il ${data.expiry_date}</p>
          <p><a href="${data.renewal_link}">Rinnova ora</a></p>
        `
      },
      payment_failed: {
        subject: 'Pagamento non riuscito',
        html: (data) => `
          <h2>Problema nel pagamento</h2>
          <p>Il pagamento dell'abbonamento non è riuscito</p>
          <p><a href="${data.payment_link}">Riprova il pagamento</a></p>
        `
      }
    };

    const emailTemplate = templates[event_type];
    if (!emailTemplate) {
      return Response.json({ error: 'Unknown email template' }, { status: 400 });
    }

    const emailHtml = emailTemplate.html(data);

    // Invia email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@pulsehr.com',
        to: recipient_email,
        subject: subject || emailTemplate.subject,
        html: emailHtml,
      })
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }

    const result = await response.json();

    // Log email
    await base44.entities.EmailLog.create({
      recipient_email,
      subject: subject || emailTemplate.subject,
      event_type,
      status: 'sent',
      message_id: result.id,
      sent_at: new Date().toISOString(),
    });

    console.log(`Email sent to ${recipient_email}:`, result.id);

    return Response.json({
      success: true,
      message_id: result.id
    });
  } catch (error) {
    console.error('Email notification error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});