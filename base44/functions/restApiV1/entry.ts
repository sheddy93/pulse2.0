/**
 * REST API v1
 * Public API endpoints per third-party integrations
 * 
 * Base URL: /api/v1/*
 * Auth: Bearer {api_key}
 * 
 * Endpoints:
 * GET    /api/v1/employees
 * GET    /api/v1/employees/{id}
 * POST   /api/v1/employees
 * PUT    /api/v1/employees/{id}
 * GET    /api/v1/leave
 * POST   /api/v1/leave
 * GET    /api/v1/attendance
 * POST   /api/v1/attendance
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// In-memory rate limiter (per production usa Redis)
const rateLimitMap = new Map();

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Route /api/v1/*
    if (!path.startsWith('/api/v1/')) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    // Estrai API key da header
    const authHeader = req.headers.get('Authorization') || '';
    const apiKey = authHeader.replace('Bearer ', '');

    if (!apiKey) {
      return Response.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    // Valida API key
    const base44 = createClientFromRequest(req);
    const keyValidation = await validateApiKey(base44, apiKey);
    
    if (!keyValidation.valid) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const { companyId, scopes } = keyValidation;

    // Rate limiting
    const now = Date.now();
    const key = `${apiKey}:${Math.floor(now / 60000)}`;
    const count = (rateLimitMap.get(key) || 0) + 1;
    rateLimitMap.set(key, count);

    if (count > 100) { // 100 req/min default
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Route dispatcher
    if (path.startsWith('/api/v1/employees')) {
      return handleEmployees(base44, method, path, url, scopes, companyId, req);
    } else if (path.startsWith('/api/v1/leave')) {
      return handleLeave(base44, method, path, url, scopes, companyId, req);
    } else if (path.startsWith('/api/v1/attendance')) {
      return handleAttendance(base44, method, path, url, scopes, companyId, req);
    } else if (path.startsWith('/api/v1/payroll')) {
      return handlePayroll(base44, method, path, url, scopes, companyId, req);
    }

    return Response.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ============ VALIDATORS ============

async function validateApiKey(base44, apiKey) {
  // Hash della key (in production usare bcrypt)
  const keyHash = await hashKey(apiKey);
  
  try {
    const keys = await base44.entities.APIKey.filter({
      key_hash: keyHash,
      is_active: true
    });

    if (!keys[0]) return { valid: false };

    // Update last_used_at
    await base44.entities.APIKey.update(keys[0].id, {
      last_used_at: new Date().toISOString()
    });

    return {
      valid: true,
      companyId: keys[0].company_id,
      scopes: keys[0].scopes
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false };
  }
}

async function hashKey(key) {
  // Semplice hash per demo (in prod usare bcrypt)
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function checkScope(scopes, requiredScope) {
  return scopes && scopes.includes(requiredScope);
}

// ============ ENDPOINTS: EMPLOYEES ============

async function handleEmployees(base44, method, path, url, scopes, companyId, req) {
  const pathParts = path.split('/');
  const employeeId = pathParts[4];

  if (method === 'GET') {
    if (!checkScope(scopes, 'read:employees')) {
      return Response.json({ error: 'Insufficient scope' }, { status: 403 });
    }

    if (employeeId) {
      // GET /api/v1/employees/{id}
      const employees = await base44.entities.EmployeeProfile.filter({ id: employeeId, company_id: companyId });
      return Response.json(employees[0] || { error: 'Not found' }, { status: employees[0] ? 200 : 404 });
    } else {
      // GET /api/v1/employees
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const employees = await base44.entities.EmployeeProfile.filter({ company_id: companyId });
      return Response.json({
        data: employees.slice(offset, offset + limit),
        total: employees.length,
        limit,
        offset
      });
    }
  } else if (method === 'POST') {
    if (!checkScope(scopes, 'write:employees')) {
      return Response.json({ error: 'Insufficient scope' }, { status: 403 });
    }

    const payload = await req.json();
    const employee = await base44.entities.EmployeeProfile.create({
      ...payload,
      company_id: companyId
    });
    return Response.json(employee, { status: 201 });
  } else if (method === 'PUT') {
    if (!checkScope(scopes, 'write:employees')) {
      return Response.json({ error: 'Insufficient scope' }, { status: 403 });
    }

    const payload = await req.json();
    await base44.entities.EmployeeProfile.update(employeeId, payload);
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

// ============ ENDPOINTS: LEAVE ============

async function handleLeave(base44, method, path, url, scopes, companyId, req) {
  if (method === 'GET') {
    if (!checkScope(scopes, 'read:leave')) {
      return Response.json({ error: 'Insufficient scope' }, { status: 403 });
    }

    const employeeId = url.searchParams.get('employee_id');
    const leave = await base44.entities.LeaveRequest.filter({
      company_id: companyId,
      ...(employeeId && { employee_id: employeeId })
    });
    return Response.json({ data: leave, total: leave.length });
  } else if (method === 'POST') {
    if (!checkScope(scopes, 'write:leave')) {
      return Response.json({ error: 'Insufficient scope' }, { status: 403 });
    }

    const payload = await req.json();
    const leave = await base44.entities.LeaveRequest.create({
      ...payload,
      company_id: companyId
    });
    return Response.json(leave, { status: 201 });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

// ============ ENDPOINTS: ATTENDANCE ============

async function handleAttendance(base44, method, path, url, scopes, companyId, req) {
  if (method === 'GET') {
    if (!checkScope(scopes, 'read:attendance')) {
      return Response.json({ error: 'Insufficient scope' }, { status: 403 });
    }

    const employeeId = url.searchParams.get('employee_id');
    const date = url.searchParams.get('date');
    const attendance = await base44.entities.AttendanceEntry.filter({
      company_id: companyId,
      ...(employeeId && { employee_id: employeeId }),
      ...(date && { attendance_date: date })
    });
    return Response.json({ data: attendance, total: attendance.length });
  } else if (method === 'POST') {
    if (!checkScope(scopes, 'write:attendance')) {
      return Response.json({ error: 'Insufficient scope' }, { status: 403 });
    }

    const payload = await req.json();
    const attendance = await base44.entities.AttendanceEntry.create({
      ...payload,
      company_id: companyId
    });
    return Response.json(attendance, { status: 201 });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

// ============ ENDPOINTS: PAYROLL ============

async function handlePayroll(base44, method, path, url, scopes, companyId, req) {
  if (method === 'GET') {
    if (!checkScope(scopes, 'read:payroll')) {
      return Response.json({ error: 'Insufficient scope' }, { status: 403 });
    }

    const payroll = await base44.entities.PayrollFile.filter({ company_id: companyId });
    return Response.json({ data: payroll, total: payroll.length });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}