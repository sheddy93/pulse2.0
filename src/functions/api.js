/**
 * REST API Endpoints
 * ─────────────────
 * Public API v1 for third-party integrations.
 * Base URL: /api/v1
 * Auth: JWT Bearer token (set via Base44 auth)
 * Rate limit: 100 req/min per user
 * 
 * TODO MIGRATION: This becomes the main API after Base44 migration
 * Currently wraps service layer, future will be direct PostgreSQL
 */

/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * API Response Wrapper
 */
function apiResponse(data, status = 200) {
  return Response.json(data, { status });
}

function apiError(message, status = 400, details = null) {
  return Response.json({
    error: message,
    status,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  }, { status });
}

/**
 * Main API Handler
 */
Deno.serve(async (req) => {
  try {
    // Parse URL
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Auth
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    // Rate limiting (TODO: Implement proper middleware)
    // For now, just track in logs
    console.log(`[API] ${method} ${path} by ${user.email}`);

    // Routes
    if (path.startsWith('/api/v1/employees')) {
      return handleEmployeeRoutes(method, path, req, base44, user);
    }
    if (path.startsWith('/api/v1/leave-requests')) {
      return handleLeaveRoutes(method, path, req, base44, user);
    }
    if (path.startsWith('/api/v1/attendance')) {
      return handleAttendanceRoutes(method, path, req, base44, user);
    }
    if (path.startsWith('/api/v1/payroll')) {
      return handlePayrollRoutes(method, path, req, base44, user);
    }

    return apiError('Not found', 404);
  } catch (error) {
    console.error('API error:', error);
    return apiError('Internal server error', 500, { error: error.message });
  }
});

/**
 * Employee API Routes
 * GET    /api/v1/employees
 * GET    /api/v1/employees/:id
 * POST   /api/v1/employees
 * PUT    /api/v1/employees/:id
 * DELETE /api/v1/employees/:id
 */
async function handleEmployeeRoutes(method, path, req, base44, user) {
  const parts = path.split('/');
  const employeeId = parts[4];

  // GET /api/v1/employees
  if (method === 'GET' && !employeeId) {
    const employees = await base44.entities.EmployeeProfile.filter({
      company_id: user.company_id,
      is_deleted: false,
    });

    return apiResponse({
      data: employees.map(e => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
        email: e.email,
        department: e.department,
        job_title: e.job_title,
        status: e.status,
        hire_date: e.hire_date,
      })),
      total: employees.length,
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/employees/:id
  if (method === 'GET' && employeeId) {
    const employee = await base44.entities.EmployeeProfile.filter({ id: employeeId });
    if (!employee[0]) return apiError('Employee not found', 404);

    const emp = employee[0];
    return apiResponse({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      email: emp.email,
      department: emp.department,
      job_title: emp.job_title,
      manager: emp.manager,
      status: emp.status,
      hire_date: emp.hire_date,
      phone: emp.phone,
    });
  }

  // POST /api/v1/employees
  if (method === 'POST' && !employeeId) {
    const body = await req.json();

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.email) {
      return apiError('Missing required fields', 400);
    }

    const newEmployee = await base44.entities.EmployeeProfile.create({
      company_id: user.company_id,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      employee_code: body.employee_code || `EMP-${Date.now()}`,
      job_title: body.job_title,
      department: body.department,
      hire_date: body.hire_date,
      status: 'active',
      has_account: false,
    });

    return apiResponse({ id: newEmployee.id, message: 'Employee created' }, 201);
  }

  // PUT /api/v1/employees/:id
  if (method === 'PUT' && employeeId) {
    const body = await req.json();
    await base44.entities.EmployeeProfile.update(employeeId, body);
    return apiResponse({ id: employeeId, message: 'Employee updated' });
  }

  // DELETE /api/v1/employees/:id
  if (method === 'DELETE' && employeeId) {
    await base44.entities.EmployeeProfile.update(employeeId, {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: user.email,
    });
    return apiResponse({ message: 'Employee deleted' });
  }

  return apiError('Method not allowed', 405);
}

/**
 * Leave Request API Routes
 */
async function handleLeaveRoutes(method, path, req, base44, user) {
  // GET /api/v1/leave-requests
  if (method === 'GET') {
    const leaves = await base44.entities.LeaveRequest.filter({
      company_id: user.company_id,
    });

    return apiResponse({
      data: leaves.map(l => ({
        id: l.id,
        employee_name: l.employee_name,
        leave_type: l.leave_type,
        start_date: l.start_date,
        end_date: l.end_date,
        days_count: l.days_count,
        status: l.status,
      })),
      total: leaves.length,
    });
  }

  // POST /api/v1/leave-requests (create)
  if (method === 'POST') {
    const body = await req.json();
    const newLeave = await base44.entities.LeaveRequest.create({
      company_id: user.company_id,
      employee_id: body.employee_id,
      employee_name: body.employee_name,
      employee_email: body.employee_email,
      leave_type: body.leave_type,
      start_date: body.start_date,
      end_date: body.end_date,
      days_count: body.days_count,
      note: body.note,
      status: 'pending',
    });

    return apiResponse({ id: newLeave.id, message: 'Leave request created' }, 201);
  }

  return apiError('Method not allowed', 405);
}

/**
 * Attendance API Routes
 */
async function handleAttendanceRoutes(method, path, req, base44, user) {
  // POST /api/v1/attendance (record time entry)
  if (method === 'POST') {
    const body = await req.json();
    const timeEntry = await base44.entities.TimeEntry.create({
      employee_id: body.employee_id,
      employee_name: body.employee_name,
      company_id: user.company_id,
      user_email: user.email,
      timestamp: new Date().toISOString(),
      type: body.type, // check_in, check_out, break_start, break_end
      latitude: body.latitude,
      longitude: body.longitude,
      location: body.location,
    });

    return apiResponse({
      id: timeEntry.id,
      message: `${body.type} recorded`,
      timestamp: new Date().toISOString(),
    }, 201);
  }

  // GET /api/v1/attendance (get entries for date)
  if (method === 'GET') {
    const date = new URL(req.url).searchParams.get('date') || new Date().toISOString().split('T')[0];
    const entries = await base44.entities.TimeEntry.filter({
      user_email: user.email,
    });

    const filtered = entries.filter(e => e.timestamp.startsWith(date));
    return apiResponse({
      data: filtered,
      date,
      total: filtered.length,
    });
  }

  return apiError('Method not allowed', 405);
}

/**
 * Payroll API Routes
 */
async function handlePayrollRoutes(method, path, req, base44, user) {
  // GET /api/v1/payroll/summary?year=2026&month=5
  if (method === 'GET' && path.includes('/summary')) {
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get('year') || '2026');
    const month = parseInt(url.searchParams.get('month') || '5');

    // TODO: Call payrollService.processMonthlyPayroll()
    return apiResponse({
      year,
      month,
      total_gross: 150000,
      total_net: 105000,
      total_taxes: 45000,
      employee_count: 25,
      generated_at: new Date().toISOString(),
    });
  }

  return apiError('Method not allowed', 405);
}