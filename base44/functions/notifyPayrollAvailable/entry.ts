import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event, data } = body;

    // Only notify on create
    if (event.type !== 'create') {
      return Response.json({ success: true });
    }

    const monthNames = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                       'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

    const monthLabel = monthNames[data.month] || `Mese ${data.month}`;

    // Create notification for employee
    await base44.asServiceRole.entities.Notification.create({
      employee_id: data.employee_id,
      employee_email: data.employee_email,
      type: 'payroll_available',
      title: `Busta paga disponibile - ${monthLabel} ${data.year}`,
      message: `La tua busta paga di ${monthLabel} ${data.year} è disponibile nel tuo profilo. Accedi per scaricarla.`,
      request_id: event.entity_id,
      request_type: 'payroll',
      is_read: false
    });

    // Update notified_at timestamp
    await base44.asServiceRole.entities.PayrollFile.update(event.entity_id, {
      notified_at: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error notifying payroll available:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});