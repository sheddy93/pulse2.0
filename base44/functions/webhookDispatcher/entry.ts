/**
 * Webhook Event Dispatcher
 * Route webhook events to appropriate handlers
 * Per integrazioni Slack, Zapier, custom webhooks
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Webhook handlers registry
const HANDLERS = {
  'leave.request.created': 'handleLeaveRequestCreated',
  'leave.request.approved': 'handleLeaveRequestApproved',
  'leave.request.rejected': 'handleLeaveRequestRejected',
  'document.signature.required': 'handleDocumentSignature',
  'overtime.request.submitted': 'handleOvertimeRequest',
  'expense.reimbursement.submitted': 'handleExpenseRequest',
  'attendance.failure': 'handleAttendanceFailure',
  'payroll.available': 'handlePayrollAvailable'
};

Deno.serve(async (req) => {
  try {
    // Verifica metodo
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const payload = await req.json();
    const { event_type, data, signature } = payload;

    if (!event_type || !data) {
      return Response.json({ error: 'Missing event_type or data' }, { status: 400 });
    }

    // Valida firma webhook (opzionale, per sicurezza)
    if (signature) {
      const isValid = await validateWebhookSignature(payload, signature);
      if (!isValid) {
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Dispatch all'handler appropriato
    const handlerName = HANDLERS[event_type];
    if (!handlerName) {
      console.warn(`No handler for event: ${event_type}`);
      return Response.json({ success: true, warning: 'No handler registered' });
    }

    // Invoca backend function handler
    const base44 = createClientFromRequest(req);
    const result = await base44.functions.invoke(handlerName, data);

    // Log audit
    await base44.asServiceRole.entities.AuditLog.create({
      company_id: data.company_id,
      action: `webhook_${event_type}`,
      actor_email: 'webhook@system',
      timestamp: new Date().toISOString(),
      details: { event_type, data_keys: Object.keys(data) }
    });

    return Response.json({ success: true, event_type, handler: handlerName });
  } catch (error) {
    console.error('Webhook dispatcher error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function validateWebhookSignature(payload, signature) {
  // Implementare validazione firma (es. HMAC-SHA256)
  // Per demo, semplificherò
  const secret = Deno.env.get('WEBHOOK_SECRET') || 'demo-secret';
  
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload) + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return computedSignature === signature;
}

// Handler placeholders
async function handleLeaveRequestCreated(data) {
  // Invia notifica manager, crea approval workflow
  console.log('Leave request created:', data);
  return { success: true };
}

async function handleLeaveRequestApproved(data) {
  // Sync calendario, notifica employee
  console.log('Leave request approved:', data);
  return { success: true };
}

async function handleDocumentSignature(data) {
  // Invia reminder firma
  console.log('Document signature required:', data);
  return { success: true };
}

async function handleOvertimeRequest(data) {
  // Crea approval workflow
  console.log('Overtime request:', data);
  return { success: true };
}

async function handleExpenseRequest(data) {
  // Crea approval workflow
  console.log('Expense request:', data);
  return { success: true };
}

async function handleAttendanceFailure(data) {
  // Notifica HR, log fallimento
  console.log('Attendance failure:', data);
  return { success: true };
}

async function handlePayrollAvailable(data) {
  // Notifica employees payslip ready
  console.log('Payroll available:', data);
  return { success: true };
}