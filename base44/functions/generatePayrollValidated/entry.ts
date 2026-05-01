/**
 * Generate Payroll with Validation
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const validatePayroll = (data) => {
  const startDate = new Date(data.period_start);
  const endDate = new Date(data.period_end);
  
  if (isNaN(startDate.getTime())) throw new Error('Invalid period_start format');
  if (isNaN(endDate.getTime())) throw new Error('Invalid period_end format');
  if (startDate >= endDate) throw new Error('period_start must be before period_end');
  if (!Array.isArray(data.employees) || data.employees.length === 0) {
    throw new Error('employees array required and not empty');
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.company_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    
    try {
      validatePayroll(payload);
    } catch (validationError) {
      console.error('[Payroll] Validation error:', validationError.message);
      return Response.json({ error: validationError.message }, { status: 400 });
    }

    const { period_start, period_end, employees } = payload;

    // Create payroll record
    const payroll = await base44.entities.PayrollFile.create({
      company_id: user.company_id,
      period_start,
      period_end,
      employees_count: employees.length,
      total_gross: employees.reduce((sum, e) => sum + (e.gross || 0), 0),
      total_net: employees.reduce((sum, e) => sum + (e.net || 0), 0),
      status: 'draft',
      created_by: user.email,
      created_date: new Date().toISOString()
    });

    console.log(`[Payroll] Generated for ${employees.length} employees`);

    return Response.json({ success: true, payroll_id: payroll.id });
  } catch (error) {
    console.error('[Payroll Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});