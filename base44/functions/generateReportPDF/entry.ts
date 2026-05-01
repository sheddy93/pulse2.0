import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      company_id,
      start_date,
      end_date,
      report_type,
      employee_id,
      include_attendance,
      include_overtime,
      include_leave
    } = await req.json();

    // Fetch company
    const companies = await base44.entities.Company.filter({ id: company_id });
    const company = companies[0];

    // Fetch employees
    const employeeQuery = { company_id, is_deleted: false };
    if (employee_id) employeeQuery.id = employee_id;
    const employees = await base44.entities.EmployeeProfile.filter(employeeQuery);

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let y = 20;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("REPORT AZIENDALE", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Azienda: ${company?.name || company_id}`, margin, y);
    y += 5;
    doc.text(`Periodo: ${start_date} al ${end_date}`, margin, y);
    y += 5;
    doc.text(`Data generazione: ${new Date().toLocaleDateString('it-IT')}`, margin, y);
    y += 5;
    doc.text(`Tipo report: ${report_type === 'payroll' ? 'Payroll' : report_type === 'activities' ? 'Attività' : 'Completo'}`, margin, y);
    y += 12;

    // Employees section
    if (employees.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("DIPENDENTI", margin, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 5, contentWidth, 6, "F");
      doc.text("Nome", margin + 2, y);
      doc.text("Email", margin + 60, y);
      doc.text("Qualifica", margin + 110, y);
      y += 10;

      employees.forEach((emp, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "normal");
        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 5, contentWidth, 7, "F");
        }

        doc.text(`${emp.first_name} ${emp.last_name}`, margin + 2, y);
        doc.text(emp.email.substring(0, 25), margin + 60, y);
        doc.text(emp.job_title || "—", margin + 110, y);
        y += 8;
      });
    }

    y += 8;

    // Payroll section
    if (report_type === "payroll" || report_type === "both") {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      const payrollFiles = await base44.entities.PayrollFile.filter({
        company_id
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("PAYROLL", margin, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const filteredPayrolls = payrollFiles.filter(p => {
        const pDate = new Date(p.uploaded_at);
        const start = new Date(start_date);
        const end = new Date(end_date);
        return pDate >= start && pDate <= end && (!employee_id || p.employee_id === employee_id);
      });

      if (filteredPayrolls.length > 0) {
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y - 5, contentWidth, 6, "F");
        doc.text("Dipendente", margin + 2, y);
        doc.text("Periodo", margin + 80, y);
        doc.text("File", margin + 120, y);
        y += 10;

        filteredPayrolls.forEach((p, idx) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, y - 5, contentWidth, 7, "F");
          }

          doc.text(p.employee_email.substring(0, 30), margin + 2, y);
          doc.text(`${p.month}/${p.year}`, margin + 80, y);
          doc.text(p.file_name.substring(0, 25), margin + 120, y);
          y += 8;
        });

        y += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Totale file payroll: ${filteredPayrolls.length}`, margin, y);
      }
    }

    // Activities section
    if (report_type === "activities" || report_type === "both") {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("ATTIVITÀ DIPENDENTI", margin, y);
      y += 8;

      // Attendance
      if (include_attendance) {
        const attendances = await base44.entities.TimeEntry.filter({
          company_id
        });

        const filteredAttendances = attendances.filter(a => {
          const aDate = new Date(a.date);
          const start = new Date(start_date);
          const end = new Date(end_date);
          return aDate >= start && aDate <= end && (!employee_id || a.employee_id === employee_id);
        });

        if (filteredAttendances.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(`Presenze: ${filteredAttendances.length} registrazioni`, margin, y);
          y += 6;
        }
      }

      // Overtime
      if (include_overtime) {
        const overtimes = await base44.entities.OvertimeRequest.filter({
          company_id
        });

        const filteredOvertimes = overtimes.filter(o => {
          const oDate = new Date(o.date);
          const start = new Date(start_date);
          const end = new Date(end_date);
          return oDate >= start && oDate <= end && (!employee_id || o.employee_id === employee_id);
        });

        if (filteredOvertimes.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(`Straordinari: ${filteredOvertimes.length} richieste`, margin, y);
          y += 6;
        }
      }

      // Leave
      if (include_leave) {
        const leaves = await base44.entities.LeaveRequest.filter({
          company_id
        });

        const filteredLeaves = leaves.filter(l => {
          const lDate = new Date(l.start_date);
          const start = new Date(start_date);
          const end = new Date(end_date);
          return lDate >= start && lDate <= end && (!employee_id || l.employee_id === employee_id);
        });

        if (filteredLeaves.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(`Ferie/Permessi: ${filteredLeaves.length} richieste`, margin, y);
          y += 6;
        }
      }
    }

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Report generato il ${new Date().toLocaleString('it-IT')}`, margin, doc.internal.pageSize.getHeight() - 10);

    const pdfData = doc.output('dataurlstring');

    console.log(`Report PDF generated for company ${company_id}, type ${report_type}`);

    return Response.json({
      file_url: pdfData,
      filename: `report_${report_type}_${new Date().getTime()}.pdf`
    });
  } catch (error) {
    console.error('generateReportPDF error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});