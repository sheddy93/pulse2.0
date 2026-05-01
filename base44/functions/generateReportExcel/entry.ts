import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    // Build CSV content (Excel compatible)
    const csvLines = [];
    
    // Header
    csvLines.push(`REPORT AZIENDALE - ${company?.name || company_id}`);
    csvLines.push(`Periodo: ${start_date} al ${end_date}`);
    csvLines.push(`Data generazione: ${new Date().toLocaleDateString('it-IT')}`);
    csvLines.push(`Tipo report: ${report_type === 'payroll' ? 'Payroll' : report_type === 'activities' ? 'Attività' : 'Completo'}`);
    csvLines.push("");

    // Employees section
    const employeeQuery = { company_id, is_deleted: false };
    if (employee_id) employeeQuery.id = employee_id;
    const employees = await base44.entities.EmployeeProfile.filter(employeeQuery);

    if (employees.length > 0) {
      csvLines.push("DIPENDENTI");
      csvLines.push("Nome,Email,Qualifica,Dipartimento,Data Assunzione");
      employees.forEach(emp => {
        csvLines.push(`"${emp.first_name} ${emp.last_name}","${emp.email}","${emp.job_title || ''}","${emp.department || ''}","${emp.hire_date || ''}"`);
      });
      csvLines.push("");
    }

    // Payroll section
    if (report_type === "payroll" || report_type === "both") {
      const payrollFiles = await base44.entities.PayrollFile.filter({ company_id });
      const filteredPayrolls = payrollFiles.filter(p => {
        const pDate = new Date(p.uploaded_at);
        const start = new Date(start_date);
        const end = new Date(end_date);
        return pDate >= start && pDate <= end && (!employee_id || p.employee_id === employee_id);
      });

      if (filteredPayrolls.length > 0) {
        csvLines.push("PAYROLL");
        csvLines.push("Email Dipendente,Mese,Anno,Nome File,Data Caricamento,Download Count");
        filteredPayrolls.forEach(p => {
          csvLines.push(`"${p.employee_email}","${p.month}","${p.year}","${p.file_name}","${new Date(p.uploaded_at).toLocaleDateString('it-IT')}","${p.download_count || 0}"`);
        });
        csvLines.push(`TOTALE FILE PAYROLL,${filteredPayrolls.length}`);
        csvLines.push("");
      }
    }

    // Activities section
    if (report_type === "activities" || report_type === "both") {
      csvLines.push("ATTIVITÀ");

      // Attendance
      if (include_attendance) {
        const attendances = await base44.entities.TimeEntry.filter({ company_id });
        const filteredAttendances = attendances.filter(a => {
          const aDate = new Date(a.date);
          const start = new Date(start_date);
          const end = new Date(end_date);
          return aDate >= start && aDate <= end && (!employee_id || a.employee_id === employee_id);
        });

        if (filteredAttendances.length > 0) {
          csvLines.push("PRESENZE");
          csvLines.push("Dipendente,Data,Ora Inizio,Ora Fine,Note");
          filteredAttendances.forEach(a => {
            csvLines.push(`"${a.employee_id}","${a.date}","${a.start_time || ''}","${a.end_time || ''}","${a.notes || ''}"`);
          });
          csvLines.push(`TOTALE PRESENZE,${filteredAttendances.length}`);
          csvLines.push("");
        }
      }

      // Overtime
      if (include_overtime) {
        const overtimes = await base44.entities.OvertimeRequest.filter({ company_id });
        const filteredOvertimes = overtimes.filter(o => {
          const oDate = new Date(o.date);
          const start = new Date(start_date);
          const end = new Date(end_date);
          return oDate >= start && oDate <= end && (!employee_id || o.employee_id === employee_id);
        });

        if (filteredOvertimes.length > 0) {
          csvLines.push("STRAORDINARI");
          csvLines.push("Dipendente,Data,Ore,Motivo,Stato");
          filteredOvertimes.forEach(o => {
            csvLines.push(`"${o.employee_name}","${o.date}","${o.hours}","${o.reason || ''}","${o.status}"`);
          });
          csvLines.push(`TOTALE STRAORDINARI,${filteredOvertimes.length}`);
          csvLines.push("");
        }
      }

      // Leave
      if (include_leave) {
        const leaves = await base44.entities.LeaveRequest.filter({ company_id });
        const filteredLeaves = leaves.filter(l => {
          const lDate = new Date(l.start_date);
          const start = new Date(start_date);
          const end = new Date(end_date);
          return lDate >= start && lDate <= end && (!employee_id || l.employee_id === employee_id);
        });

        if (filteredLeaves.length > 0) {
          csvLines.push("FERIE E PERMESSI");
          csvLines.push("Dipendente,Tipo,Data Inizio,Data Fine,Giorni,Stato");
          filteredLeaves.forEach(l => {
            csvLines.push(`"${l.employee_name}","${l.leave_type}","${l.start_date}","${l.end_date}","${l.days_count}","${l.status}"`);
          });
          csvLines.push(`TOTALE RICHIESTE,${filteredLeaves.length}`);
          csvLines.push("");
        }
      }
    }

    csvLines.push("");
    csvLines.push(`Generato il ${new Date().toLocaleString('it-IT')}`);

    const csvContent = csvLines.join("\n");

    console.log(`Report Excel generated for company ${company_id}, type ${report_type}`);

    return Response.json({
      data: 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent),
      filename: `report_${report_type}_${new Date().getTime()}.csv`
    });
  } catch (error) {
    console.error('generateReportExcel error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});