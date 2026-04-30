import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event, data, old_data, automation } = body;

    // Extract company_id from event data
    const company_id = data?.company_id || old_data?.company_id;
    if (!company_id) {
      return Response.json({ error: 'No company_id found' }, { status: 400 });
    }

    // Determine entity name display
    let entity_name = '';
    const entityType = event.entity_name;

    if (entityType === 'EmployeeProfile') {
      entity_name = `${data?.first_name || old_data?.first_name || ''} ${data?.last_name || old_data?.last_name || ''}`.trim();
    } else if (entityType === 'LeaveRequest') {
      entity_name = data?.employee_name || old_data?.employee_name || event.entity_id;
    } else if (entityType === 'OvertimeRequest') {
      entity_name = `${data?.employee_name || old_data?.employee_name} - ${data?.hours || old_data?.hours}h`;
    } else if (entityType === 'Document') {
      entity_name = data?.title || old_data?.title || event.entity_id;
    } else if (entityType === 'Asset') {
      entity_name = data?.asset_name || old_data?.asset_name || event.entity_id;
    } else if (entityType === 'AssetAssignment') {
      entity_name = `${data?.asset_name || old_data?.asset_name} → ${data?.employee_name || old_data?.employee_name}`;
    } else if (entityType === 'Shift') {
      entity_name = `${data?.employee_name || old_data?.employee_name} - ${data?.date || old_data?.date}`;
    } else if (entityType === 'Company') {
      entity_name = data?.name || old_data?.name || event.entity_id;
    } else {
      entity_name = event.entity_id;
    }

    // Create audit log entry
    await base44.asServiceRole.entities.AuditLog.create({
      company_id,
      user_email: user.email,
      action: event.type,
      entity_type: entityType,
      entity_id: event.entity_id,
      entity_name,
      old_data: event.type === 'update' ? old_data : undefined,
      new_data: event.type === 'delete' ? undefined : data,
      changed_fields: data?.changed_fields || undefined
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});