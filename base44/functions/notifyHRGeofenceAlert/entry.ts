import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Notify HR Geofence Alert - IMPROVED ERROR HANDLING
 * Alerts HR team when employee clocks in outside geofence
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { employee_id, employee_name, employee_email, location_name, distance_km } = body;

    if (!employee_id || !location_name) {
      console.error('[GEOFENCE] Missing required alert data');
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`[GEOFENCE] Alert for ${employee_name} at ${location_name} (${distance_km}km away)`);

    // Create alert record
    const alert = await base44.asServiceRole.entities.OutOfGeofenceAlert.create({
      employee_id,
      employee_name,
      employee_email,
      location_name,
      distance_km,
      alert_type: distance_km > 10 ? 'critical' : 'warning',
      status: 'pending',
      created_at: new Date().toISOString()
    });

    // Find HR managers for this company
    const company = await base44.asServiceRole.entities.Company.filter({ id: body.company_id });
    if (!company.length) {
      console.warn('[GEOFENCE] Company not found');
      return Response.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    const hrManagers = await base44.asServiceRole.entities.User.filter({
      role: { $in: ['hr_manager', 'company_admin'] },
      company_id: body.company_id
    });

    // Send notifications
    const notificationResults = [];
    for (const manager of hrManagers) {
      try {
        const severity = distance_km > 10 ? '🔴 CRITICA' : '🟡 AVVISO';
        
        await base44.integrations.Core.SendEmail({
          to: manager.email,
          subject: `${severity} Anomalia geofence: ${employee_name}`,
          body: `
L'employee ${employee_name} ha registrato un check-in a ${distance_km}km di distanza da ${location_name}.
Verificare se è un errore GPS o un'assenza autorizzata.
          `
        });

        notificationResults.push({
          manager: manager.email,
          status: 'sent'
        });

        console.log(`[GEOFENCE] Notified ${manager.email}`);
      } catch (emailErr) {
        console.warn(`[GEOFENCE] Email to ${manager.email} failed:`, emailErr.message);
        notificationResults.push({
          manager: manager.email,
          status: 'failed',
          error: emailErr.message
        });
      }
    }

    // Log alert
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'geofence_alert',
      entity_name: 'OutOfGeofenceAlert',
      entity_id: alert.id,
      details: {
        employee_name,
        location_name,
        distance_km,
        notifications_sent: notificationResults.filter(r => r.status === 'sent').length
      },
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      alert_id: alert.id,
      notifications_sent: notificationResults.filter(r => r.status === 'sent').length,
      results: notificationResults
    });
  } catch (error) {
    console.error('[GEOFENCE ALERT ERROR]:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return Response.json(
      { error: error.message, code: 'GEOFENCE_ALERT_FAILED' },
      { status: 500 }
    );
  }
});