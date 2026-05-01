import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Notifica HR team su alert geofence con workflow
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { alert_id, employee_name, location_name, distance_meters, severity, workflow_approval_id } = await req.json();

    // Ottieni alert per company_id
    const alerts = await base44.asServiceRole.entities.OutOfGeofenceAlert.filter({
      id: alert_id
    });

    if (!alerts[0]) {
      return Response.json({ error: 'Alert not found' }, { status: 404 });
    }

    const alert = alerts[0];
    const company_id = alert.company_id;

    // Ottieni HR managers
    const admins = await base44.asServiceRole.entities.User.filter({
      company_id,
      role: { $in: ['company_admin', 'hr_manager'] }
    });

    if (admins.length === 0) {
      console.log('No HR managers found');
      return Response.json({ notified: 0 });
    }

    const severityEmojis = { high: '🔴', medium: '🟡', low: '🟢' };
    const emoji = severityEmojis[severity] || '🟡';

    const emailBody = `
${emoji} GEOFENCE ALERT - Clock-in fuori dal perimetro

Dipendente: ${employee_name}
Sede: ${location_name}
Distanza: ${distance_meters}m
Severità: ${severity.toUpperCase()}
Timestamp: ${new Date().toISOString()}

${workflow_approval_id ? `
📋 Workflow di approvazione ID: ${workflow_approval_id}
Azione richiesta: Revisione e approvazione
` : ''}

Accedi alla dashboard per maggiori dettagli.
    `.trim();

    const hrEmails = admins.map(a => a.email);

    // Invia email notifica
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: hrEmails.join(','),
      subject: `${emoji} [Geofence Alert] ${employee_name} - Clock-in fuori sede`,
      body: emailBody,
      from_name: 'PulseHR System'
    });

    // Registra notifiche
    const sentToEmails = admins.map(a => a.email);
    await base44.asServiceRole.entities.OutOfGeofenceAlert.update(alert_id, {
      alert_sent_to: sentToEmails
    });

    // Crea audit log
    await base44.asServiceRole.functions.invoke('createAuditLog', {
      company_id,
      action: 'geofence_alert_notification_sent',
      details: {
        alert_id,
        employee_name,
        distance_meters,
        notified_count: hrEmails.length
      }
    });

    console.log(`✉️ Notified ${hrEmails.length} HR managers about geofence alert`);
    return Response.json({ notified: hrEmails.length, emails: hrEmails });

  } catch (error) {
    console.error('❌ Error in notifyHRGeofenceAlert:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});