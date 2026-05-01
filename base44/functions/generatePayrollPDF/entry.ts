import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';
import 'npm:jspdf/dist/jspdf.umd.min.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, month, year, employee_id } = await req.json();

    // Fetch payroll files
    const query = { company_id, month, year };
    if (employee_id) query.employee_id = employee_id;

    const payrollFiles = await base44.entities.PayrollFile.filter(query);
    
    if (payrollFiles.length === 0) {
      return Response.json({ error: 'No payroll data found' }, { status: 404 });
    }

    // Fetch company and employee data
    const [companies, employees] = await Promise.all([
      base44.entities.Company.filter({ id: company_id }),
      base44.entities.EmployeeProfile.filter({ company_id, is_deleted: false })
    ]);

    const company = companies[0];
    const employeeMap = {};
    employees.forEach(e => {
      employeeMap[e.id] = e;
    });

    // Create PDF
    const doc = new jsPDF();
    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
                       "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("RIEPILOGO PAYROLL", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Azienda: ${company?.name || company_id}`, 20, 30);
    doc.text(`Periodo: ${monthNames[month - 1]} ${year}`, 20, 37);
    doc.text(`Data generazione: ${new Date().toLocaleDateString('it-IT')}`, 20, 44);

    // Table header
    let y = 60;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const tableWidth = pageWidth - 2 * margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, tableWidth, 7, "F");
    
    const colWidths = [30, 40, 40, 35, 30];
    let x = margin;
    const headers = ["ID Dip.", "Nome", "Email", "Data Caric.", "Download"];
    headers.forEach((h, i) => {
      doc.text(h, x + 2, y);
      x += colWidths[i];
    });

    // Table rows
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    payrollFiles.forEach((p, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const emp = employeeMap[p.employee_id];
      const empName = emp ? `${emp.first_name} ${emp.last_name}` : "N/A";
      const uploadDate = new Date(p.uploaded_at).toLocaleDateString('it-IT');

      const rowData = [
        p.employee_id.substring(0, 8),
        empName.substring(0, 15),
        p.employee_email.substring(0, 15),
        uploadDate,
        String(p.download_count || 0)
      ];

      x = margin;
      rowData.forEach((data, i) => {
        doc.text(data, x + 2, y);
        x += colWidths[i];
      });

      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 5, tableWidth, 7, "F");
      }

      y += 8;
    });

    // Summary section
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("RIEPILOGO", margin, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const uniqueEmployees = new Set(payrollFiles.map(p => p.employee_id)).size;
    doc.text(`Totale dipendenti: ${uniqueEmployees}`, margin, y);
    y += 6;
    doc.text(`Totale file: ${payrollFiles.length}`, margin, y);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generato il ${new Date().toLocaleString('it-IT')}`, margin, doc.internal.pageSize.getHeight() - 10);

    // Get PDF as data URL
    const pdfData = doc.output('dataurlstring');

    console.log(`Payroll PDF generated for company ${company_id}, period ${month}/${year}, ${payrollFiles.length} files`);

    return Response.json({
      file_url: pdfData,
      rows: payrollFiles.length
    });
  } catch (error) {
    console.error('generatePayrollPDF error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});