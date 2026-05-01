/**
 * src/lib/permissions.ts
 * ======================
 * Definizione centralizzata permessi per ruoli
 * 
 * Usato da permissionService
 * TODO MIGRATION: replicare su NestJS con Guards
 */

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'view_dashboard',
    'manage_platform',
    'manage_companies',
    'manage_users',
    'view_all_data',
    'manage_billing',
    'manage_feature_flags',
  ],

  company_owner: [
    'view_dashboard',
    'manage_company',
    'view_employees',
    'create_employee',
    'update_employee',
    'delete_employee',
    'view_attendance',
    'manage_attendance',
    'view_leave',
    'approve_leave_request',
    'view_documents',
    'upload_documents',
    'view_payroll',
    'manage_payroll',
    'view_billing',
    'manage_billing',
    'manage_integrations',
    'view_audit_logs',
  ],

  company_admin: [
    'view_dashboard',
    'view_employees',
    'create_employee',
    'update_employee',
    'view_attendance',
    'manage_attendance',
    'view_leave',
    'approve_leave_request',
    'view_documents',
    'upload_documents',
    'view_payroll',
    'manage_payroll',
    'view_audit_logs',
  ],

  hr_manager: [
    'view_dashboard',
    'view_employees',
    'create_employee',
    'update_employee',
    'view_attendance',
    'view_leave',
    'approve_leave_request',
    'view_documents',
    'upload_documents',
    'view_payroll',
  ],

  manager: [
    'view_dashboard',
    'view_employees', // Only team
    'view_attendance', // Only team
    'approve_attendance',
    'view_leave', // Only team
    'approve_leave_request', // Only team
  ],

  employee: [
    'view_dashboard',
    'create_attendance',
    'view_own_attendance',
    'create_leave_request',
    'view_own_leave',
    'view_own_documents',
    'download_documents',
    'view_own_payroll',
  ],

  external_consultant: [
    'view_dashboard',
    'view_assigned_documents',
    'download_documents',
    'view_assigned_employees',
  ],

  labor_consultant: [
    'view_dashboard',
    'view_audit_logs',
    'view_attendance',
    'view_leave',
    'view_documents',
    'view_employees',
  ],

  safety_consultant: [
    'view_dashboard',
    'view_attendance',
    'view_incidents',
    'view_employees',
  ],
};

// Alias per compatibilità
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_COMPANY: 'manage_company',
  VIEW_EMPLOYEES: 'view_employees',
  CREATE_EMPLOYEE: 'create_employee',
  UPDATE_EMPLOYEE: 'update_employee',
  DELETE_EMPLOYEE: 'delete_employee',
  VIEW_ATTENDANCE: 'view_attendance',
  CREATE_ATTENDANCE: 'create_attendance',
  MANAGE_ATTENDANCE: 'manage_attendance',
  APPROVE_ATTENDANCE: 'approve_attendance',
  VIEW_LEAVE: 'view_leave',
  CREATE_LEAVE_REQUEST: 'create_leave_request',
  APPROVE_LEAVE_REQUEST: 'approve_leave_request',
  VIEW_DOCUMENTS: 'view_documents',
  UPLOAD_DOCUMENTS: 'upload_documents',
  DOWNLOAD_DOCUMENTS: 'download_documents',
  ARCHIVE_DOCUMENTS: 'archive_documents',
  VIEW_PAYROLL: 'view_payroll',
  MANAGE_PAYROLL: 'manage_payroll',
  VIEW_BILLING: 'view_billing',
  MANAGE_BILLING: 'manage_billing',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_INTEGRATIONS: 'manage_integrations',
  USE_AI_ASSISTANT: 'use_ai_assistant',
} as const;