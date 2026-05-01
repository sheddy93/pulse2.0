/**
 * sendTrialEmails.js
 * ------------------
 * Invia email automatiche per trial scadenze e transizioni.
 * Triggera da automazioni schedulate.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { trigger_type } = payload; // 'trial_reminder_3days', 'trial_reminder_1day', 'trial_expired'

    console.log(`[sendTrialEmails] Triggato: ${trigger_type}`);

    // Carica template email
    const templates = await base44.asServiceRole.entities.EmailTemplate.list();
    const template = templates.find(t => t.template_type === trigger_type && t.is_enabled);

    if (!template) {
      console.warn(`[sendTrialEmails] Template non trovato: ${trigger_type}`);
      return Response.json({ success: false, message: 'Template non trovato' });
    }

    // Trova trial da notificare
    let query = { status: 'active' };
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    if (trigger_type === 'trial_reminder_1day') {
      // Trial che scadono oggi o domani, non ancora notificati
      query.reminder_email_sent = false;
    } else if (trigger_type === 'trial_reminder_3days') {
      query.reminder_email_sent = false;
    } else if (trigger_type === 'trial_expired') {
      // Trial scaduti
      query.status = 'expired';
    }

    const trials = await base44.asServiceRole.entities.TrialSubscription.filter(query);
    console.log(`[sendTrialEmails] Trovati ${trials.length} trial da notificare`);

    let successCount = 0;
    let errorCount = 0;

    for (const trial of trials) {
      try {
        const trialEndDate = new Date(trial.trial_end);
        
        // Filtra in base al tipo di reminder
        let shouldSend = false;
        if (trigger_type === 'trial_reminder_1day') {
          const daysLeft = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
          shouldSend = daysLeft <= 1 && daysLeft > 0;
        } else if (trigger_type === 'trial_reminder_3days') {
          const daysLeft = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
          shouldSend = daysLeft <= 3 && daysLeft > 1;
        } else if (trigger_type === 'trial_expired') {
          shouldSend = trialEndDate <= now;
        }

        if (!shouldSend) continue;

        // Prepara variabili email
        const variables = {
          company_name: trial.company_name || 'Azienda',
          contact_name: trial.contact_name || 'Caro utente',
          trial_end: trialEndDate.toLocaleDateString('it-IT'),
          days_left: Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)),
          plan_name: trial.selected_plan ? trial.selected_plan.charAt(0).toUpperCase() + trial.selected_plan.slice(1) : 'Professional',
          price: trial.total_monthly_price?.toFixed(2) || '79.00',
          addons_count: trial.selected_addons?.length || 0
        };

        // Sostituisci variabili nel template
        let body = template.body;
        let subject = template.subject;
        Object.entries(variables).forEach(([key, value]) => {
          body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
          subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });

        // Invia email
        const recipients = [];
        if (template.send_to === 'contact_email' || template.send_to === 'both') {
          recipients.push(trial.contact_email);
        }
        if (template.send_to === 'company_email' || template.send_to === 'both') {
          recipients.push(trial.company_email);
        }

        for (const email of recipients) {
          try {
            await base44.integrations.Core.SendEmail({
              to: email,
              subject: subject,
              body: body
            });

            // Log email inviata
            await base44.asServiceRole.entities.EmailLog.create({
              trial_id: trial.id,
              template_type: trigger_type,
              recipient_email: email,
              recipient_name: trial.contact_name,
              company_name: trial.company_name,
              subject: subject,
              body_preview: body.substring(0, 200),
              status: 'sent',
              metadata: { plan: trial.selected_plan, price: trial.total_monthly_price },
              sent_at: new Date().toISOString()
            });

            successCount++;
          } catch (emailError) {
            console.error(`[sendTrialEmails] Errore invio a ${email}:`, emailError.message);
            errorCount++;

            // Log errore
            await base44.asServiceRole.entities.EmailLog.create({
              trial_id: trial.id,
              template_type: trigger_type,
              recipient_email: email,
              recipient_name: trial.contact_name,
              company_name: trial.company_name,
              subject: subject,
              body_preview: body.substring(0, 200),
              status: 'failed',
              error_message: emailError.message,
              metadata: { plan: trial.selected_plan },
              sent_at: new Date().toISOString()
            });
          }
        }

        // Aggiorna trial con flag reminder inviato
        if (trigger_type === 'trial_reminder_1day' || trigger_type === 'trial_reminder_3days') {
          await base44.asServiceRole.entities.TrialSubscription.update(trial.id, {
            reminder_email_sent: true
          });
        }

        // Se trial scaduto, aggiorna status
        if (trigger_type === 'trial_expired' && trialEndDate <= now) {
          await base44.asServiceRole.entities.TrialSubscription.update(trial.id, {
            status: 'expired'
          });
        }
      } catch (trialError) {
        console.error(`[sendTrialEmails] Errore per trial ${trial.id}:`, trialError.message);
        errorCount++;
      }
    }

    console.log(`[sendTrialEmails] Completato: ${successCount} inviate, ${errorCount} errori`);
    return Response.json({ success: true, sent: successCount, errors: errorCount });
  } catch (error) {
    console.error('[sendTrialEmails] Errore generale:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});