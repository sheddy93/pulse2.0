import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, month, year, employee_id } = await req.json();

    // Fetch payroll files based on filters
    const query = { company_id, month, year };
    if (employee_id) query.employee_id = employee_id;

    const payrollFiles = await base44.entities.PayrollFile.filter(query);
    
    if (payrollFiles.length === 0) {
      return Response.json({ error: 'No payroll data found' }, { status: 404 });
    }

    // Fetch employee data for context
    const employees = await base44.entities.EmployeeProfile.filter({
      company_id,
      is_deleted: false
    });

    const employeeMap = {};
    employees.forEach(e => {
      employeeMap[e.id] = e;
    });

    // Build CSV content
    const csvLines = [
      "RIEPILOGO PAYROLL",
      `Azienda,${company_id}`,
      `Periodo,${month}/${year}`,
      new Date().toLocaleDateString('it-IT'),
      "",
      "ID Dipendente,Nome,Email,Mese,Anno,File,Data Caricamento,Download Count"
    ];

    payrollFiles.forEach(p => {
      const emp = employeeMap[p.employee_id];
      const empName = emp ? `${emp.first_name} ${emp.last_name}` : "N/A";
      csvLines.push(
        `"${p.employee_id}","${empName}","${p.employee_email}",${p.month},${p.year},"${p.file_name}","${new Date(p.uploaded_at).toLocaleDateString('it-IT')}",${p.download_count || 0}`
      );
    });

    // Add summary
    csvLines.push("");
    csvLines.push("RIEPILOGO");
    csvLines.push(`Totale dipendenti,${new Set(payrollFiles.map(p => p.employee_id)).size}`);
    csvLines.push(`Totale file,${payrollFiles.length}`);

    const csvContent = csvLines.join("\n");

    // Upload to storage
    const file = new File([csvContent], `payroll_${year}-${String(month).padStart(2, '0')}.csv`, { type: 'text/csv' });
    const fileFormData = new FormData();
    fileFormData.append('file', file);

    const uploadRes = await base44.integrations.Core.UploadFile({
      file: csvContent
    }).catch(() => ({ file_url: null }));

    console.log(`Payroll CSV generated for company ${company_id}, period ${month}/${year}`);

    return Response.json({
      file_url: uploadRes.file_url || 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent),
      rows: payrollFiles.length
    });
  } catch (error) {
    console.error('generatePayrollCSV error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});