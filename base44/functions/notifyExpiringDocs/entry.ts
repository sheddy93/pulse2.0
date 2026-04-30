import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Admin-only: triggered by scheduled automation, verify via service role
  const allDocs = await base44.asServiceRole.entities.Document.list();
  const allEmployees = await base44.asServiceRole.entities.EmployeeProfile.list();
  const allCompanies = await base44.asServiceRole.entities.Company.list();
  const allUsers = await base44.asServiceRole.entities.User.list();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Notify for docs expiring in exactly 30 days or 7 days
  const ALERT_DAYS = [30, 7];
  const notified = [];

  for (const doc of allDocs) {
    if (!doc.expiry_date) continue;

    const expiry = new Date(doc.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((expiry - today) / (1000 * 60 * 60 * 24));

    if (!ALERT_DAYS.includes(daysLeft)) continue;

    const company = allCompanies.find(c => c.id === doc.company_id);
    if (!company) continue;

    // Find the company owner/admin email
    const companyUser = allUsers.find(u => u.email === company.owner_email && (u.role === "company" || u.role === "super_admin"));
    const recipientEmail = companyUser?.email || company.owner_email || company.email;
    if (!recipientEmail) continue;

    // Find employee if linked
    const emp = allEmployees.find(e => e.id === doc.employee_id);
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : null;

    const subject = daysLeft === 7
      ? `🚨 Documento in scadenza tra 7 giorni: ${doc.title}`
      : `⚠️ Documento in scadenza tra 30 giorni: ${doc.title}`;

    const body = [
      `Attenzione, il documento "${doc.title}" ${empName ? `relativo al dipendente ${empName} ` : ""}sta per scadere.`,
      ``,
      `📅 Data scadenza: ${doc.expiry_date}`,
      `⏳ Giorni rimasti: ${daysLeft}`,
      ``,
      `Accedi alla piattaforma PulseHR per rinnovare o aggiornare il documento:`,
      `https://pulsehr.base44.app/dashboard/company/documents/expiring`,
      ``,
      `Il team PulseHR`,
    ].join("\n");

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipientEmail,
      subject,
      body,
      from_name: "PulseHR",
    });

    notified.push({ docId: doc.id, title: doc.title, daysLeft, to: recipientEmail });
  }

  return Response.json({ checked: allDocs.length, notified });
});