import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all pending signatures (not signed and not rejected)
    const documents = await base44.asServiceRole.entities.Document.filter({});
    const pendingDocs = documents.filter(doc => 
      doc.signature_required && 
      doc.signature_status === 'pending' &&
      doc.employee_id
    );

    let sentCount = 0;

    for (const doc of pendingDocs) {
      // Check if we already sent a reminder in the last 3 days
      if (doc.last_reminder_sent) {
        const lastReminder = new Date(doc.last_reminder_sent);
        const daysSinceReminder = Math.floor((Date.now() - lastReminder.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceReminder < 3) continue;
      }

      // Get employee email
      const employees = await base44.asServiceRole.entities.EmployeeProfile.filter({ id: doc.employee_id });
      if (!employees[0]?.email) continue;

      const employee = employees[0];
      
      // Send reminder email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: employee.email,
        subject: `Sollecito: Firma richiesta per ${doc.title}`,
        body: `Caro ${employee.first_name},\n\nTi ricordiamo che il documento "${doc.title}" rimane in attesa di firma.\n\nAccedi al tuo portale dipendente e completa la firma per proseguire.\n\nGrazie,\nTeam HR`
      });

      // Update last_reminder_sent
      await base44.asServiceRole.entities.Document.update(doc.id, {
        last_reminder_sent: new Date().toISOString()
      });

      sentCount++;
    }

    return Response.json({ success: true, sentCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});