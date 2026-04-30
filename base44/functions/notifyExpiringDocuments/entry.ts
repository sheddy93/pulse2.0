import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { differenceInDays, parse } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all documents with expiry dates
    const documents = await base44.asServiceRole.entities.Document.list();
    
    const today = new Date();
    const notificationsToSend = [];

    for (const doc of documents) {
      if (!doc.expiry_date) continue;

      const expiryDate = new Date(doc.expiry_date);
      const daysUntilExpiry = differenceInDays(expiryDate, today);

      // Check if document expires in exactly 7 days and hasn't been reminded yet
      if (daysUntilExpiry === 7) {
        // Check if we already sent a reminder recently (avoid duplicates)
        if (doc.last_reminder_sent) {
          const lastReminder = new Date(doc.last_reminder_sent);
          const daysSinceReminder = differenceInDays(today, lastReminder);
          if (daysSinceReminder < 7) continue; // Already reminded within last 7 days
        }

        notificationsToSend.push(doc);
      }
    }

    // Send emails for each document
    for (const doc of notificationsToSend) {
      const recipients = new Set();

      // Add employee email if assigned
      if (doc.employee_id) {
        const employees = await base44.asServiceRole.entities.EmployeeProfile.filter({ id: doc.employee_id });
        if (employees.length > 0 && employees[0].email) {
          recipients.add(employees[0].email);
        }
      }

      // Add company consultants
      if (doc.company_id) {
        const consultantLinks = await base44.asServiceRole.entities.ConsultantCompanyLink.filter({
          company_id: doc.company_id,
          status: "approved"
        });
        
        for (const link of consultantLinks) {
          if (link.consultant_email) {
            recipients.add(link.consultant_email);
          }
        }
      }

      // Send email to each recipient
      for (const email of recipients) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `Promemoria: Documento in scadenza - ${doc.title}`,
          body: `Ciao,\n\nIl documento "${doc.title}" scade tra 7 giorni (${doc.expiry_date}).\n\nTi consigliamo di rinnovarlo al più presto per evitare interruzioni.\n\nSaluti,\nPulseHR`
        });
      }

      // Update document to mark reminder as sent
      await base44.asServiceRole.entities.Document.update(doc.id, {
        last_reminder_sent: today.toISOString()
      });
    }

    return Response.json({
      success: true,
      notifications_sent: notificationsToSend.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});