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

    const entityType = event.entity_name;
    let requestType = '';
    let title = '';
    let message = '';

    if (entityType === 'LeaveRequest') {
      requestType = 'leave';
      const leaveTypeMap = { ferie: 'Ferie', permesso: 'Permesso', malattia: 'Malattia', extra: 'Extra' };
      title = `Nuova richiesta di ${leaveTypeMap[data.leave_type] || 'assenza'}`;
      message = `${data.employee_name} ha richiesto ${data.days_count} giorni di ${leaveTypeMap[data.leave_type] || 'assenza'} da ${data.start_date} a ${data.end_date}.`;
    } else if (entityType === 'OvertimeRequest') {
      requestType = 'overtime';
      title = `Nuova richiesta di straordinario`;
      message = `${data.employee_name} ha richiesto ${data.hours} ore di straordinario per ${data.date}.`;
    } else {
      return Response.json({ success: true });
    }

    // Get employee to find manager
    const employees = await base44.asServiceRole.entities.EmployeeProfile.filter({
      id: data.employee_id
    });

    if (employees.length === 0) {
      return Response.json({ success: true });
    }

    const employee = employees[0];
    const managerEmail = employee.manager;

    if (managerEmail) {
      // Notify manager - create notification
      await base44.asServiceRole.entities.Notification.create({
        employee_id: employee.id,
        employee_email: managerEmail,
        type: `${requestType}_pending_approval`,
        title,
        message,
        request_id: event.entity_id,
        request_type: requestType,
        is_read: false
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error notifying manager:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});