import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Generate Payroll Advanced - IMPROVED ERROR HANDLING & LOGGING
 * Generates detailed payroll reports with tax calculations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.company_id) {
      console.warn('[PAYROLL] Unauthorized access');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { period_start, period_end, include_pdf = false } = body;

    if (!period_start || !period_end) {
      console.error('[PAYROLL] Missing date parameters');
      return Response.json({ error: 'Missing period_start or period_end' }, { status: 400 });
    }

    console.log(`[PAYROLL] Generating for period: ${period_start} to ${period_end}`);

    // Fetch employees
    const employees = await base44.entities.EmployeeProfile.filter({
      company_id: user.company_id,
      is_deleted: { $ne: true }
    });

    if (!employees.length) {
      console.warn('[PAYROLL] No active employees found');
      return Response.json({ 
        success: true, 
        employees: 0, 
        message: 'No active employees in company' 
      });
    }

    // Fetch time entries for period
    const startDate = new Date(period_start).toISOString();
    const endDate = new Date(period_end).toISOString();

    const timeEntries = await base44.entities.TimeEntry.filter({
      user_email: { $in: employees.map(e => e.email) },
      created_date: { $gte: startDate, $lte: endDate }
    });

    console.log(`[PAYROLL] Found ${timeEntries.length} time entries for ${employees.length} employees`);

    // Calculate payroll
    const payrollData = employees.map(emp => {
      const empEntries = timeEntries.filter(e => e.user_email === emp.email);
      const totalHours = empEntries.length * 8; // Simplified calculation
      const hourlyRate = emp.salary ? emp.salary / 160 : 0; // Rough estimate
      const grossPay = totalHours * hourlyRate;
      const tax = grossPay * 0.22; // 22% tax
      const netPay = grossPay - tax;

      return {
        employee_name: `${emp.first_name} ${emp.last_name}`,
        employee_email: emp.email,
        hours_worked: totalHours,
        gross_pay: grossPay.toFixed(2),
        tax: tax.toFixed(2),
        net_pay: netPay.toFixed(2),
        time_entries: empEntries.length
      };
    });

    // Create payroll document
    const payrollFile = await base44.entities.PayrollDocument.create({
      company_id: user.company_id,
      period_start: period_start,
      period_end: period_end,
      employees_count: employees.length,
      total_gross: payrollData.reduce((sum, p) => sum + parseFloat(p.gross_pay), 0),
      total_tax: payrollData.reduce((sum, p) => sum + parseFloat(p.tax), 0),
      total_net: payrollData.reduce((sum, p) => sum + parseFloat(p.net_pay), 0),
      generated_by: user.email,
      status: 'draft',
      details: payrollData
    });

    console.log(`[PAYROLL] Generated payroll document: ${payrollFile.id}`);

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      company_id: user.company_id,
      action: 'payroll_generated',
      entity_name: 'PayrollDocument',
      entity_id: payrollFile.id,
      actor_email: user.email,
      details: { employees_count: employees.length, period_start, period_end },
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      payroll_id: payrollFile.id,
      employees: payrollData.length,
      total_gross: payrollFile.total_gross.toFixed(2),
      total_net: payrollFile.total_net.toFixed(2),
      status: 'draft',
      data: payrollData
    });
  } catch (error) {
    console.error('[PAYROLL ERROR]:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return Response.json(
      { error: error.message, code: 'PAYROLL_GENERATION_FAILED' },
      { status: 500 }
    );
  }
});