import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event, data, old_data } = body;

    // Only notify on update when status changes to manager_approved
    if (event.type !== 'update' || !old_data) {
      return Response.json({ success: true });
    }

    if (old_data.status === data.status) {
      return Response.json({ success: true });
    }

    const entityType = event.entity_name;
    let requestType = '';
    let title = '';
    let message = '';

    if (data.status === 'manager_approved' && entityType === 'LeaveRequest') {
      requestType = 'leave';
      const leaveTypeMap = { ferie: 'Ferie', permesso: 'Permesso', malattia: 'Malattia', extra: 'Extra' };
      title = `Approvazione parziale: ${leaveTypeMap[data.leave_type] || 'assenza'} in attesa HR`;
      message = `${data.employee_name} - ${data.days_count} giorni di ${leaveTypeMap[data.leave_type] || 'assenza'} (Approvato dal manager, in attesa HR)`;
    } else if (data.status === 'manager_approved' && entityType === 'OvertimeRequest') {
      requestType = 'overtime';
      title = `Approvazione parziale: straordinario in attesa HR`;
      message = `${data.employee_name} - ${data.hours} ore di straordinario (Approvato dal manager, in attesa HR)`;
    } else {
      return Response.json({ success: true });
    }

    // Get company HR users and notify them
    const company = data.company_id;
    const admins = await base44.asServiceRole.entities.User.filter({});
    
    for (const admin of admins) {
      if (admin.role === 'admin' || admin.role === 'company') {
        await base44.asServiceRole.entities.Notification.create({
          employee_id: data.employee_id,
          employee_email: admin.email,
          type: `${requestType}_manager_approved`,
          title,
          message,
          request_id: event.entity_id,
          request_type: requestType,
          is_read: false
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error notifying HR:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});