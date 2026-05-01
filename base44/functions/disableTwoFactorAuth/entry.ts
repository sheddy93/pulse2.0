import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Recupera TOTP enabled
    const totpSecrets = await base44.entities.TotpSecret.filter({
      user_email: user.email,
      is_enabled: true
    });

    if (totpSecrets.length === 0) {
      return Response.json({ error: '2FA not enabled' }, { status: 400 });
    }

    const totpSecret = totpSecrets[0];

    // Disabilita 2FA
    await base44.entities.TotpSecret.update(totpSecret.id, {
      is_enabled: false
    });

    // Log audit
    await base44.entities.AuditLog.create({
      action: 'disable_two_factor_auth',
      actor_email: user.email,
      entity_name: 'TotpSecret',
      entity_id: totpSecret.id,
      details: { timestamp: new Date().toISOString() }
    });

    // Invia email di conferma
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: '🔓 Autenticazione a Due Fattori Disabilitata',
      body: `
        <h2>2FA Disabilitato</h2>
        <p>L'autenticazione a due fattori è stata disabilitata sul tuo account.</p>
        <p>D'ora in poi, potrai accedere usando solo la password.</p>
        <p><strong>Se non hai fatto questo cambiamento</strong>, <a href="https://app.pulsehr.it/dashboard/employee/notification-settings">riabilita il 2FA immediatamente</a>.</p>
      `
    });

    return Response.json({
      success: true,
      message: '2FA disabled'
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});