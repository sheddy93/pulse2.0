/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Notifica automatiche per documenti personali in scadenza
 * Viene eseguita giornalmente per verificare documenti che scadono entro 30 giorni
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

    // Ottieni tutti i documenti personali
    const documents = await base44.asServiceRole.entities.EmployeePersonalDocument.filter({
      company_id: companyId
    });

    const notificationsSent = [];
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const doc of documents) {
      if (!doc.expiry_date) continue;

      const expiryDate = new Date(doc.expiry_date);
      
      // Notifica se scade tra 1 e 30 giorni e non è stata già inviata
      if (expiryDate > today && expiryDate <= thirtyDaysFromNow && !doc.notification_sent) {
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        // Recupera email dell'employee
        const employees = await base44.asServiceRole.entities.EmployeeProfile.filter({
          id: doc.employee_id
        });

        if (employees.length > 0) {
          const emp = employees[0];

          // Invia email all'employee
          await base44.integrations.Core.SendEmail({
            to: emp.email,
            subject: `⚠️ Documento in scadenza: ${doc.document_name}`,
            body: `
              <h2>Avviso di Scadenza Documento</h2>
              <p>Caro/a ${emp.first_name} ${emp.last_name},</p>
              <p>Il documento <strong>${doc.document_name}</strong> scade tra <strong>${daysUntilExpiry} giorni</strong> (${doc.expiry_date}).</p>
              <p>Ti consigliamo di rinnovarlo il prima possibile e caricarlo nel sistema.</p>
              <p>Accedi al tuo profilo nella sezione "I Miei Documenti" per caricare il documento aggiornato.</p>
              <p>Cordiali saluti,<br/>Team Risorse Umane</p>
            `
          });

          // Se il documento è condiviso, notifica anche HR
          if (doc.is_public) {
            await base44.integrations.Core.SendEmail({
              to: "hr@company.com",
              subject: `📢 Documento in scadenza - ${emp.first_name} ${emp.last_name}`,
              body: `
                <h2>Notifica Scadenza Documento Dipendente</h2>
                <p>Il documento <strong>${doc.document_name}</strong> dell'employee <strong>${emp.first_name} ${emp.last_name}</strong> scade tra <strong>${daysUntilExpiry} giorni</strong>.</p>
                <p>Si prega di contattare il dipendente per il rinnovo.</p>
              `
            });
          }

          // Aggiorna documento con flag notifica inviata
          await base44.asServiceRole.entities.EmployeePersonalDocument.update(doc.id, {
            notification_sent: true,
            last_notification_date: new Date().toISOString()
          });

          notificationsSent.push({
            employee: `${emp.first_name} ${emp.last_name}`,
            document: doc.document_name,
            daysUntilExpiry,
            shared: doc.is_public
          });
        }
      }
    }

    return Response.json({
      success: true,
      notifications_sent: notificationsSent.length,
      details: notificationsSent
    });
  } catch (error) {
    console.error('Personal document expiry notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});