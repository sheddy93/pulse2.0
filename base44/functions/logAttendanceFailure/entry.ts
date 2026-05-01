import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const {
      company_id,
      employee_id,
      employee_email,
      employee_name,
      location_id,
      location_name,
      attempt_type,
      failure_reason,
      employee_latitude,
      employee_longitude,
      distance_from_location_meters,
      notes
    } = await req.json();

    const base44 = createClientFromRequest(req);

    // Log del tentativo fallito
    await base44.asServiceRole.entities.AttendanceFailureLog.create({
      company_id,
      employee_id,
      employee_email,
      employee_name,
      location_id,
      location_name,
      attempt_type,
      failure_reason,
      employee_latitude,
      employee_longitude,
      distance_from_location_meters,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      attempted_at: new Date().toISOString(),
      notes,
    });

    console.log(`[ATTENDANCE FAILURE] ${employee_name} - ${attempt_type} - ${failure_reason}`);

    return Response.json({
      success: true,
      message: 'Tentativo fallito registrato'
    });
  } catch (error) {
    console.error('logAttendanceFailure error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});