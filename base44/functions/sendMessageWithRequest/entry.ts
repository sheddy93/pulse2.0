/**
 * Send Message with Request Integration
 * Invia messaggio e crea richiesta opzionale
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      conversation_id,
      receiver_email,
      content,
      request_type,
      request_data
    } = await req.json();

    // Crea messaggio
    const message = await base44.entities.WorkMessage.create({
      conversation_id,
      sender_email: user.email,
      sender_name: user.full_name,
      receiver_email,
      company_id: user.company_id,
      content,
      message_type: request_type ? 'request' : 'text',
      request_type,
      request_data,
      sent_at: new Date().toISOString()
    });

    // Se c'è una richiesta, crea il record corrispondente
    if (request_type && request_data) {
      if (request_type === 'leave') {
        await base44.entities.LeaveRequest.create({
          employee_id: user.id,
          company_id: user.company_id,
          start_date: request_data.start_date,
          end_date: request_data.end_date,
          reason: request_data.reason,
          status: 'pending'
        });
      } else if (request_type === 'overtime') {
        await base44.entities.OvertimeRequest.create({
          employee_id: user.id,
          company_id: user.company_id,
          date: request_data.date,
          hours: request_data.hours,
          reason: request_data.reason,
          status: 'pending'
        });
      } else if (request_type === 'expense') {
        await base44.entities.ExpenseReimbursement.create({
          employee_id: user.id,
          company_id: user.company_id,
          amount: request_data.amount,
          category: request_data.category,
          expense_date: request_data.date,
          description: request_data.reason,
          status: 'submitted'
        });
      }
    }

    return Response.json({ 
      success: true, 
      message 
    });

  } catch (error) {
    console.error('Message send error:', error);
    return Response.json({ 
      error: error.message || 'Failed to send message' 
    }, { status: 500 });
  }
});