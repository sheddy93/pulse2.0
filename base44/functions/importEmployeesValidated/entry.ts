/**
 * Import Employees from CSV with Validation
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const validateEmployeeRow = (row) => {
  if (!row.first_name || row.first_name.trim().length === 0) throw new Error('first_name required');
  if (!row.last_name || row.last_name.trim().length === 0) throw new Error('last_name required');
  if (!row.email || !row.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) throw new Error('Invalid email');
  if (row.hire_date && isNaN(new Date(row.hire_date).getTime())) throw new Error('Invalid hire_date format');
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.company_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { employees } = payload;

    if (!Array.isArray(employees) || employees.length === 0) {
      return Response.json({ error: 'employees array required and not empty' }, { status: 400 });
    }

    // Validate each row
    const errors = [];
    for (let i = 0; i < employees.length; i++) {
      try {
        validateEmployeeRow(employees[i]);
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      return Response.json({ error: 'Validation errors', details: errors }, { status: 400 });
    }

    // Create employees
    const created = await base44.entities.EmployeeProfile.bulkCreate(
      employees.map(e => ({
        company_id: user.company_id,
        first_name: e.first_name.trim(),
        last_name: e.last_name.trim(),
        email: e.email.toLowerCase().trim(),
        job_title: e.job_title || '',
        hire_date: e.hire_date || new Date().toISOString(),
        status: 'active'
      }))
    );

    console.log(`[Import] Created ${created.length} employees by ${user.email}`);

    return Response.json({ success: true, count: created.length });
  } catch (error) {
    console.error('[Import Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});