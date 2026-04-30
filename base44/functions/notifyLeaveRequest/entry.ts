import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const payload = await req.json();

  const { event, data, old_data } = payload;

  // Triggered on LeaveRequest update — notify employee when status changes
  const newStatus = data?.status;
  const oldStatus = old_data?.status;

  if (!data || newStatus === oldStatus || newStatus === "pending") {
    return Response.json({ skipped: true });
  }

  const employeeEmail = data.employee_email;
  const employeeName = data.employee_name || "Dipendente";
  const leaveType = { ferie: "Ferie", permesso: "Permesso", malattia: "Malattia", extra: "Straordinario" }[data.leave_type] || data.leave_type;
  const isApproved = newStatus === "approved";

  if (!employeeEmail) return Response.json({ skipped: true, reason: "no employee email" });

  const subject = isApproved
    ? `✅ Richiesta di ${leaveType} approvata`
    : `❌ Richiesta di ${leaveType} non approvata`;

  const body = isApproved
    ? `Ciao ${employeeName},\n\nLa tua richiesta di ${leaveType.toLowerCase()} dal ${data.start_date} al ${data.end_date} è stata approvata.\n${data.admin_note ? `\nNota HR: ${data.admin_note}` : ""}\n\nBuone vacanze!\nIl team PulseHR`
    : `Ciao ${employeeName},\n\nLa tua richiesta di ${leaveType.toLowerCase()} dal ${data.start_date} al ${data.end_date} non è stata approvata.\n${data.admin_note ? `\nMotivazione: ${data.admin_note}` : ""}\n\nPer chiarimenti contatta il tuo responsabile HR.\nIl team PulseHR`;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: employeeEmail,
    subject,
    body,
    from_name: "PulseHR",
  });

  return Response.json({ sent: true, to: employeeEmail, status: newStatus });
});