/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Notifica automatiche per corsi in scadenza
 * Viene eseguita giornalmente per verificare corsi che scadono entro 30 giorni
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { companyId } = body;

    if (!companyId) {
      return Response.json({ error: 'companyId required' }, { status: 400 });
    }

    // Ottieni tutti gli enrollments attivi
    const enrollments = await base44.asServiceRole.entities.TrainingEnrollment.filter({
      company_id: companyId,
      status: { $in: ["completed", "in_progress"] }
    });

    const notificationsSent = [];
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const enrollment of enrollments) {
      if (!enrollment.expiry_date) continue;

      const expiryDate = new Date(enrollment.expiry_date);
      
      // Notifica se scade tra 1 e 30 giorni
      if (expiryDate > today && expiryDate <= thirtyDaysFromNow) {
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        // Invia email
        await base44.integrations.Core.SendEmail({
          to: enrollment.employee_email,
          subject: `⚠️ Corso in scadenza: ${enrollment.course_title}`,
          body: `
            <h2>Avviso di Scadenza Corso</h2>
            <p>Caro/a ${enrollment.employee_name},</p>
            <p>La certificazione per il corso <strong>${enrollment.course_title}</strong> scade tra <strong>${daysUntilExpiry} giorni</strong> (${enrollment.expiry_date}).</p>
            <p>Ti consigliamo di aggiornarti o rinnovare la certificazione il prima possibile.</p>
            <p>Accedi al sistema per caricare la nuova certificazione.</p>
            <p>Cordiali saluti,<br/>Team Risorse Umane</p>
          `
        });

        notificationsSent.push({
          employee: enrollment.employee_name,
          course: enrollment.course_title,
          daysUntilExpiry
        });
      }
    }

    // Notifica certificati in scadenza
    const certifications = await base44.asServiceRole.entities.TrainingCertification.filter({
      company_id: companyId,
      status: { $in: ["active", "pending_renewal"] }
    });

    for (const cert of certifications) {
      if (!cert.expiry_date) continue;

      const expiryDate = new Date(cert.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

      if (expiryDate > today && expiryDate <= thirtyDaysFromNow) {
        // Aggiorna stato a pending_renewal
        await base44.asServiceRole.entities.TrainingCertification.update(cert.id, {
          status: daysUntilExpiry <= 0 ? "expired" : "pending_renewal"
        });

        // Invia notifica
        await base44.integrations.Core.SendEmail({
          to: cert.employee_name ? `employee_${cert.employee_id}@internal` : cert.employee_id,
          subject: `🔄 Certificazione in scadenza: ${cert.certification_name}`,
          body: `
            <h2>Rinnovo Certificazione</h2>
            <p>La certificazione <strong>${cert.certification_name}</strong> scade tra <strong>${daysUntilExpiry} giorni</strong>.</p>
            <p>Carica la nuova certificazione nel sistema per mantenerla attiva.</p>
          `
        });
      }
    }

    return Response.json({
      success: true,
      notifications_sent: notificationsSent.length,
      details: notificationsSent
    });
  } catch (error) {
    console.error('Training expiry notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});