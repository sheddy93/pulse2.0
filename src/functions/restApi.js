/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts';

const ENDPOINTS = {
  '/api/v1/employees': { method: 'GET', permission: 'read:employees' },
  '/api/v1/time-entries': { method: 'GET', permission: 'read:time_entries' },
  '/api/v1/leave-requests': { method: 'GET', permission: 'read:leave_requests' },
  '/api/v1/webhooks': { method: 'POST', permission: 'write:webhooks' },
  '/api/v1/webhooks/list': { method: 'GET', permission: 'write:webhooks' },
  '/api/v1/health': { method: 'GET', permission: null }
};

/**
 * Estrai API key dall'header Authorization
 */
const extractApiKey = (authHeader) => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
};

/**
 * Hash API key con SHA-256
 */
const hashApiKey = async (key) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verifica autenticazione API
 */
const verifyApiKey = async (base44, companyId, apiKey) => {
  if (!apiKey) return null;
  
  try {
    const keyHash = await hashApiKey(apiKey);
    const keys = await base44.asServiceRole.entities.APIKey.filter({
      company_id: companyId,
      is_active: true
    });
    
    return keys.find(k => k.key_hash === keyHash) || null;
  } catch (error) {
    console.error('Key verification failed:', error);
    return null;
  }
};

/**
 * Middleware di autenticazione
 */
const authenticate = async (request, base44) => {
  const authHeader = request.headers.get('Authorization');
  const companyId = request.headers.get('X-Company-ID');
  
  if (!authHeader || !companyId) {
    return { valid: false, error: 'Missing Authorization header or X-Company-ID' };
  }

  const apiKey = extractApiKey(authHeader);
  const apiKeyRecord = await verifyApiKey(base44, companyId, apiKey);
  
  if (!apiKeyRecord) {
    return { valid: false, error: 'Invalid or expired API key' };
  }

  return { valid: true, apiKey: apiKeyRecord, companyId };
};

/**
 * GET /api/v1/employees
 */
const getEmployees = async (base44, companyId) => {
  const employees = await base44.asServiceRole.entities.EmployeeProfile.filter({
    company_id: companyId
  });
  
  return {
    data: employees.map(e => ({
      id: e.id,
      first_name: e.first_name,
      last_name: e.last_name,
      email: e.email,
      employee_code: e.employee_code,
      job_title: e.job_title,
      department: e.department,
      status: e.status,
      hire_date: e.hire_date
    })),
    count: employees.length
  };
};

/**
 * GET /api/v1/time-entries
 */
const getTimeEntries = async (base44, companyId, query) => {
  const filters = { company_id: companyId };
  
  if (query.get('employee_id')) filters.employee_id = query.get('employee_id');
  if (query.get('start_date')) {
    filters.timestamp = { $gte: query.get('start_date') };
  }
  if (query.get('end_date')) {
    if (filters.timestamp) {
      filters.timestamp.$lte = query.get('end_date');
    } else {
      filters.timestamp = { $lte: query.get('end_date') };
    }
  }

  const entries = await base44.asServiceRole.entities.TimeEntry.filter(filters);
  
  return {
    data: entries.map(e => ({
      id: e.id,
      employee_id: e.employee_id,
      employee_name: e.employee_name,
      type: e.type,
      timestamp: e.timestamp,
      location: e.location,
      latitude: e.latitude,
      longitude: e.longitude
    })),
    count: entries.length
  };
};

/**
 * GET /api/v1/leave-requests
 */
const getLeaveRequests = async (base44, companyId, query) => {
  const filters = { company_id: companyId };
  
  if (query.get('status')) filters.status = query.get('status');
  if (query.get('employee_id')) filters.employee_id = query.get('employee_id');

  const leaves = await base44.asServiceRole.entities.LeaveRequest.filter(filters);
  
  return {
    data: leaves.map(l => ({
      id: l.id,
      employee_id: l.employee_id,
      employee_name: l.employee_name,
      leave_type: l.leave_type,
      start_date: l.start_date,
      end_date: l.end_date,
      days_count: l.days_count,
      status: l.status,
      manager_approved_at: l.manager_approved_at
    })),
    count: leaves.length
  };
};

/**
 * POST /api/v1/webhooks
 */
const registerWebhook = async (base44, companyId, body) => {
  try {
    const data = JSON.parse(body);
    
    if (!data.webhook_url || !data.integration_type) {
      return {
        error: 'Missing webhook_url or integration_type',
        status: 400
      };
    }

    const webhook = await base44.asServiceRole.entities.WebhookIntegration.create({
      company_id: companyId,
      name: data.name || `Webhook ${Date.now()}`,
      integration_type: data.integration_type,
      webhook_url: data.webhook_url,
      api_key: crypto.getRandomValues(new Uint8Array(32)).toString(),
      api_secret: crypto.getRandomValues(new Uint8Array(32)).toString(),
      events: data.events || ['employee_created', 'time_entry_created'],
      config: data.config || {}
    });

    return {
      data: {
        id: webhook.id,
        webhook_url: webhook.webhook_url,
        api_key: webhook.api_key,
        events: webhook.events
      },
      status: 201
    };
  } catch (error) {
    return { error: error.message, status: 400 };
  }
};

/**
 * GET /api/v1/webhooks/list
 */
const listWebhooks = async (base44, companyId) => {
  const webhooks = await base44.asServiceRole.entities.WebhookIntegration.filter({
    company_id: companyId
  });

  return {
    data: webhooks.map(w => ({
      id: w.id,
      name: w.name,
      integration_type: w.integration_type,
      webhook_url: w.webhook_url,
      events: w.events,
      is_active: w.is_active,
      last_triggered_at: w.last_triggered_at
    })),
    count: webhooks.length
  };
};

/**
 * GET /api/v1/health
 */
const getHealth = () => {
  return {
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };
};

/**
 * Handler principale REST API
 */
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  const key = `${method} ${path}`;

  // Health check (no auth needed)
  if (path === '/api/v1/health') {
    return Response.json(getHealth());
  }

  // Valida endpoint
  if (!ENDPOINTS[path] || ENDPOINTS[path].method !== method) {
    return Response.json(
      { error: 'Endpoint not found' },
      { status: 404 }
    );
  }

  // Autentica richiesta
  const base44 = createClientFromRequest(req);
  const auth = await authenticate(req, base44);
  
  if (!auth.valid) {
    return Response.json(
      { error: auth.error },
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verifica permessi
  const endpoint = ENDPOINTS[path];
  if (endpoint.permission && !auth.apiKey.permissions.includes(endpoint.permission)) {
    return Response.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    let result;

    if (path === '/api/v1/employees') {
      result = await getEmployees(base44, auth.companyId);
    } else if (path === '/api/v1/time-entries') {
      result = await getTimeEntries(base44, auth.companyId, url.searchParams);
    } else if (path === '/api/v1/leave-requests') {
      result = await getLeaveRequests(base44, auth.companyId, url.searchParams);
    } else if (path === '/api/v1/webhooks') {
      const body = await req.text();
      result = await registerWebhook(base44, auth.companyId, body);
    } else if (path === '/api/v1/webhooks/list') {
      result = await listWebhooks(base44, auth.companyId);
    }

    const status = result.status || 200;
    delete result.status;

    return Response.json(result, { status, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});