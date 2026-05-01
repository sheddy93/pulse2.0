import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Notifica HR team su alert turni (sovrapposizione/copertura)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { company_id, alerts } = await req.json();

    // Ottieni HR managers
    const admins = await base44.asServiceRole.entities.User.filter({
      company_id,
      role: { $in: ['company_admin', 'hr_manager'] }
    });

    if (admins.length === 0) {
      console.log('No HR managers found');
      return Response.json({ notified: 0 });
    }

    const hrEmails = admins.map(a => a.email);

    const emailBody = `
📋 ALERT TURNI - Azione Richiesta

${alerts.map(alert => {
  if (alert.type === 'overlap') {
    return `🔴 SOVRAPPOSIZIONE TURNI RILEVATA
Un dipendente ha turni sovrapposti nella stessa giornata.

ID Alert: ${alert.id}
Accedi alla dashboard per la revisione.`;
  } else if (alert.type === 'low_coverage') {
    return `🟡 MANCANZA DI COPERTURA
Una fascia oraria non ha il numero minimo di dipendenti assegnati.

ID Alert: ${alert.id}
Accedi alla dashboard per la revisione.`;
  }
  return '';
}).join('\n\n')}

Accedi a: /dashboard/company/shifts
    `.trim();

    // Invia email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: hrEmails.join(','),
      subject: `⚠️ [Turni Alert] ${alerts.length} alert generato/i`,
      body: emailBody,
      from_name: 'PulseHR System'
    });

    console.log(`✉️ Notified ${hrEmails.length} HR managers about shift alerts`);
    return Response.json({ notified: hrEmails.length });

  } catch (error) {
    console.error('❌ Error in notifyShiftAlerts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});