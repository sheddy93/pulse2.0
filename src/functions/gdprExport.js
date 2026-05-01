/**
 * GDPR Data Export Function
 * ────────────────────────
 * Export all personal data for a user (right to access).
 * Format: JSON or CSV
 * Returns: Downloadable file URL
 * 
 * TODO MIGRATION: Stays same with PostgreSQL
 */

/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { format = 'json' } = await req.json(); // json or csv

    // Fetch all personal data
    const data = {
      user_profile: user,
      employee_profile: null,
      leave_requests: [],
      time_entries: [],
      documents: [],
      performance_reviews: [],
      notifications: [],
      audit_logs: [],
    };

    // Employee profile
    const employees = await base44.entities.EmployeeProfile.filter({
      user_email: user.email,
    });
    if (employees[0]) data.employee_profile = employees[0];

    // Leave requests
    const leaves = await base44.entities.LeaveRequest.filter({
      employee_email: user.email,
    });
    data.leave_requests = leaves;

    // Time entries
    const timeEntries = await base44.entities.TimeEntry.filter({
      user_email: user.email,
    });
    data.time_entries = timeEntries;

    // Documents
    const documents = await base44.entities.Document.filter({
      employee_id: employees[0]?.id,
    });
    data.documents = documents;

    // Performance reviews
    const reviews = await base44.entities.PerformanceReview.filter({
      employee_id: employees[0]?.id,
    });
    data.performance_reviews = reviews;

    // Notifications
    const notifications = await base44.entities.Notification.filter({
      recipient_email: user.email,
    });
    data.notifications = notifications;

    // Audit logs related to this user
    const auditLogs = await base44.entities.AuditLog.filter({
      user_email: user.email,
    });
    data.audit_logs = auditLogs;

    // Format response
    let responseBody, contentType, filename;

    if (format === 'json') {
      responseBody = JSON.stringify(data, null, 2);
      contentType = 'application/json';
      filename = `gdpr_export_${user.email}_${new Date().toISOString().split('T')[0]}.json`;
    } else {
      // CSV format (flatten data)
      responseBody = convertToCSV(data);
      contentType = 'text/csv';
      filename = `gdpr_export_${user.email}_${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Log GDPR request for compliance
    await base44.entities.AuditLog.create({
      company_id: employees[0]?.company_id,
      action: 'gdpr_data_export',
      user_email: user.email,
      user_name: user.full_name,
      details: { format, timestamp: new Date().toISOString() },
      ip_address: req.headers.get('X-Forwarded-For') || 'unknown',
      timestamp: new Date().toISOString(),
    });

    return new Response(responseBody, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('GDPR export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Convert data to CSV
 * @private
 */
function convertToCSV(data) {
  const rows = [];

  rows.push('=== USER PROFILE ===');
  rows.push('Field,Value');
  rows.push(`Email,${data.user_profile.email}`);
  rows.push(`Full Name,${data.user_profile.full_name}`);
  rows.push(`Created,${data.user_profile.created_date}`);

  rows.push('');
  rows.push('=== EMPLOYEE PROFILE ===');
  if (data.employee_profile) {
    rows.push('Field,Value');
    rows.push(`First Name,${data.employee_profile.first_name}`);
    rows.push(`Last Name,${data.employee_profile.last_name}`);
    rows.push(`Department,${data.employee_profile.department}`);
    rows.push(`Job Title,${data.employee_profile.job_title}`);
    rows.push(`Hire Date,${data.employee_profile.hire_date}`);
  }

  rows.push('');
  rows.push('=== LEAVE REQUESTS ===');
  rows.push('ID,Type,Start,End,Days,Status,Date');
  data.leave_requests.forEach(l => {
    rows.push(`${l.id},${l.leave_type},${l.start_date},${l.end_date},${l.days_count},${l.status},${l.created_date}`);
  });

  rows.push('');
  rows.push('=== TIME ENTRIES ===');
  rows.push('Timestamp,Type,Location');
  data.time_entries.forEach(t => {
    rows.push(`${t.timestamp},${t.type},${t.location || '—'}`);
  });

  rows.push('');
  rows.push(`Export Date: ${new Date().toISOString()}`);
  rows.push('This is your personal data export per GDPR Article 15');

  return rows.join('\n');
}