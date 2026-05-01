/**
 * trialWelcomeEmail.js
 * --------------------
 * Invia email di benvenuto ai nuovi utenti in trial.
 * Triggered: entity automation su TrialSubscription create
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { data } = payload;

    if (!data) return Response.json({ success: false });

    const { contact_name, contact_email, trial_end, company_name } = data;

    // Invia email di benvenuto
    await base44.integrations.Core.SendEmail({
      to: contact_email,
      subject: `Benvenuto in PulseHR! Inizia il tuo trial gratuito di 14 giorni`,
      body: `Ciao ${contact_name},\n\nBenvenuto in PulseHR! 🎉\n\nIl tuo trial gratuito è attivo e scadrà il ${new Date(trial_end).toLocaleDateString('it-IT')}.\n\nIn questo periodo puoi:\n✅ Gestire dipendenti illimitati\n✅ Accedere a tutti i moduli (presenze, ferie, documenti, straordinari)\n✅ Invitare il tuo team per testare insieme\n✅ Contattare il nostro supporto italiano 24/7\n\nLink per accedere: https://app.pulsehr.io\n\nHai domande? Rispondi a questa email o contatta il nostro team.\n\nBuona fortuna!\nIl team di PulseHR`
    });

    // Aggiorna lo stato
    await base44.asServiceRole.entities.TrialSubscription.update(data.id, {
      welcome_email_sent: true
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});