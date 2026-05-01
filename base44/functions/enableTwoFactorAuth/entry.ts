import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { token } = await req.json();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Recupera secret TOTP pendente
    const totpSecrets = await base44.entities.TotpSecret.filter({
      user_email: user.email,
      is_enabled: false
    });

    if (totpSecrets.length === 0) {
      return Response.json({ error: 'No pending 2FA setup' }, { status: 400 });
    }

    const totpSecret = totpSecrets[0];

    // Verifica token prima di abilitare
    // In produzione: speakeasy.totp.verify()
    const isValid = /^\d{6}$/.test(token);

    if (!isValid) {
      return Response.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Abilita 2FA
    await base44.entities.TotpSecret.update(totpSecret.id, {
      is_enabled: true,
      enabled_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString()
    });

    // Log audit
    await base44.entities.AuditLog.create({
      action: 'enable_two_factor_auth',
      actor_email: user.email,
      entity_name: 'TotpSecret',
      entity_id: totpSecret.id,
      details: { timestamp: new Date().toISOString() }
    });

    // Invia email di conferma
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: '✅ Autenticazione a Due Fattori Abilitata',
      body: `
        <h2>2FA Attivato con Successo</h2>
        <p>L'autenticazione a due fattori è ora abilitata sul tuo account.</p>
        <p><strong>Cosa succede ora:</strong></p>
        <ul>
          <li>Dovrai inserire un codice 6 cifre dal tuo autenticatore ad ogni login</li>
          <li>Hai 10 codici di backup per l'accesso di emergenza</li>
          <li>Conserva i codici di backup in luogo sicuro</li>
        </ul>
        <p>Se non hai abilitato tu questo 2FA, <a href="https://app.pulsehr.it/dashboard/employee/notification-settings">disabilita immediatamente</a>.</p>
      `
    });

    return Response.json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});