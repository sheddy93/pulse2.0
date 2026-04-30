import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const payload = await req.json();

  const { data } = payload;

  // Triggered on ConsultantCompanyLink create — notify consultant when company requests link
  if (!data || data.status !== "pending_consultant") {
    return Response.json({ skipped: true, reason: "not a pending_consultant request" });
  }

  const consultantEmail = data.consultant_email;
  const companyName = data.company_name || "Un'azienda";

  if (!consultantEmail) return Response.json({ skipped: true, reason: "no consultant email" });

  const subject = `🔗 ${companyName} ti ha inviato una richiesta di collegamento`;
  const body = `Ciao,\n\n${companyName} ha richiesto di collegarti come consulente sulla piattaforma PulseHR.\n\nAccedi alla tua dashboard per accettare o rifiutare la richiesta:\nhttps://pulsehr.base44.app/dashboard/consultant/link-requests\n\nIl team PulseHR`;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: consultantEmail,
    subject,
    body,
    from_name: "PulseHR",
  });

  return Response.json({ sent: true, to: consultantEmail });
});