import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (event.type !== 'update') {
      return Response.json({ success: true });
    }

    // Only notify if status changed
    if (old_data?.status === data?.status) {
      return Response.json({ success: true });
    }

    const statusChanged = data.status !== old_data?.status;
    if (!statusChanged) {
      return Response.json({ success: true });
    }

    const isApproved = data.status === 'approved';
    const isRejected = data.status === 'rejected';

    if (!isApproved && !isRejected) {
      return Response.json({ success: true });
    }

    // Create notification
    const notificationType = isApproved ? 'leave_approved' : 'leave_rejected';
    const title = isApproved 
      ? 'Ferie approvate' 
      : 'Richiesta ferie rifiutata';
    const message = isApproved
      ? `La tua richiesta di ferie dal ${data.start_date} al ${data.end_date} è stata approvata.`
      : `La tua richiesta di ferie dal ${data.start_date} al ${data.end_date} è stata rifiutata.${data.admin_note ? ` Motivo: ${data.admin_note}` : ''}`;

    await base44.asServiceRole.entities.Notification.create({
      employee_id: data.employee_id,
      employee_email: data.employee_email,
      type: notificationType,
      title,
      message,
      request_id: event.entity_id,
      request_type: 'leave',
      is_read: false
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});