import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Scheduled automation: Notify managers of upcoming performance reviews
 * Should be called: Last Friday of each month
 * Reminds managers: "Performance reviews due next week"
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all companies (for multi-tenancy)
    const companies = await base44.entities.Company.filter({});

    let notificationsCount = 0;

    for (const company of companies) {
      // Get all managers in company
      const managers = await base44.entities.EmployeeProfile.filter({
        company_id: company.id,
        job_title: { $in: ['Manager', 'Team Lead', 'HR Manager'] }
      });

      for (const manager of managers) {
        // Check if performance reviews need to be done
        // Look for direct reports
        const reports = await base44.entities.EmployeeProfile.filter({
          company_id: company.id,
          manager_email: manager.user_email
        });

        if (reports.length === 0) continue;

        // Create notification
        await base44.entities.Notification.create({
          user_email: manager.user_email,
          type: 'performance',
          title: '⏰ Valutazioni Annuali',
          content: `Hai ${reports.length} dipendenti da valutare. Scadenza: fine mese`,
          related_entity: 'PerformanceReview',
          is_read: false
        });

        // Send email
        await base44.integrations.Core.SendEmail({
          to: manager.user_email,
          subject: '⏰ Reminder: Valutazioni performance in scadenza',
          body: `
            <h2>Valutazioni annuali in scadenza</h2>
            <p>Ricordati di completare le valutazioni 360° per i tuoi ${reports.length} collaboratori.</p>
            <p>Scadenza: <strong>fine del mese</strong></p>
            <ul>
              ${reports.map(r => `<li>${r.first_name} ${r.last_name}</li>`).join('')}
            </ul>
            <p><a href="https://app.pulsehr.it/dashboard/company/performance" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Vai alle Valutazioni</a></p>
          `
        });

        notificationsCount++;
      }
    }

    console.log(`Performance review reminders sent to ${notificationsCount} managers`);

    return Response.json({
      success: true,
      notifications_sent: notificationsCount
    });
  } catch (error) {
    console.error('Error notifying performance reviews:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});