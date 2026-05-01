/**
 * lib/permissions.js
 * Matrice centralizzata RBAC
 * TODO MIGRATION: Questo diventerà una tabella role_permissions + policy check su backend Python
 */

import { ROLES } from './roles';

export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',
  
  // Aziende
  MANAGE_COMPANY: 'manage_company',
  VIEW_COMPANY_SETTINGS: 'view_company_settings',
  
  // Dipendenti
  VIEW_EMPLOYEES: 'view_employees',
  CREATE_EMPLOYEE: 'create_employee',
  UPDATE_EMPLOYEE: 'update_employee',
  DELETE_EMPLOYEE: 'delete_employee',
  
  // Presenze
  VIEW_ATTENDANCE: 'view_attendance',
  MANAGE_ATTENDANCE: 'manage_attendance',
  APPROVE_ATTENDANCE: 'approve_attendance',
  
  // Ferie
  VIEW_LEAVE: 'view_leave',
  CREATE_LEAVE_REQUEST: 'create_leave_request',
  APPROVE_LEAVE_REQUEST: 'approve_leave_request',
  
  // Documenti
  VIEW_DOCUMENTS: 'view_documents',
  UPLOAD_DOCUMENTS: 'upload_documents',
  DOWNLOAD_DOCUMENTS: 'download_documents',
  ARCHIVE_DOCUMENTS: 'archive_documents',
  
  // Payroll
  VIEW_PAYROLL: 'view_payroll',
  MANAGE_PAYROLL: 'manage_payroll',
  
  // Billing
  VIEW_BILLING: 'view_billing',
  MANAGE_BILLING: 'manage_billing',
  
  // Admin
  VIEW_ADMIN_PANEL: 'view_admin_panel',
  MANAGE_PLATFORM: 'manage_platform',
};

// Matrice ruoli → permessi
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Tutto
    ...Object.values(PERMISSIONS),
  ],
  
  [ROLES.COMPANY_OWNER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_COMPANY,
    PERMISSIONS.VIEW_COMPANY_SETTINGS,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.CREATE_EMPLOYEE,
    PERMISSIONS.UPDATE_EMPLOYEE,
    PERMISSIONS.DELETE_EMPLOYEE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.APPROVE_ATTENDANCE,
    PERMISSIONS.VIEW_LEAVE,
    PERMISSIONS.APPROVE_LEAVE_REQUEST,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.DOWNLOAD_DOCUMENTS,
    PERMISSIONS.ARCHIVE_DOCUMENTS,
    PERMISSIONS.VIEW_PAYROLL,
    PERMISSIONS.MANAGE_PAYROLL,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.MANAGE_BILLING,
  ],
  
  [ROLES.COMPANY_ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_COMPANY_SETTINGS,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.CREATE_EMPLOYEE,
    PERMISSIONS.UPDATE_EMPLOYEE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.APPROVE_ATTENDANCE,
    PERMISSIONS.VIEW_LEAVE,
    PERMISSIONS.APPROVE_LEAVE_REQUEST,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.DOWNLOAD_DOCUMENTS,
    PERMISSIONS.ARCHIVE_DOCUMENTS,
    PERMISSIONS.VIEW_PAYROLL,
    PERMISSIONS.MANAGE_PAYROLL,
  ],
  
  [ROLES.HR_MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.CREATE_EMPLOYEE,
    PERMISSIONS.UPDATE_EMPLOYEE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.APPROVE_ATTENDANCE,
    PERMISSIONS.VIEW_LEAVE,
    PERMISSIONS.APPROVE_LEAVE_REQUEST,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.DOWNLOAD_DOCUMENTS,
    PERMISSIONS.VIEW_PAYROLL,
    PERMISSIONS.MANAGE_PAYROLL,
  ],
  
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.APPROVE_ATTENDANCE,
    PERMISSIONS.VIEW_LEAVE,
    PERMISSIONS.APPROVE_LEAVE_REQUEST,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.DOWNLOAD_DOCUMENTS,
  ],
  
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_LEAVE,
    PERMISSIONS.CREATE_LEAVE_REQUEST,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.DOWNLOAD_DOCUMENTS,
  ],
  
  [ROLES.EXTERNAL_CONSULTANT]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_LEAVE,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.DOWNLOAD_DOCUMENTS,
    PERMISSIONS.VIEW_PAYROLL,
  ],
};

/**
 * Funzione centrale: can(user, permission)
 * Controlla se un utente ha un permesso
 * TODO MIGRATION: Questa logica si sposterà su backend Python come middleware
 */
export const can = (user, permission) => {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * Variante: canAny(user, permissionList)
 * Ritorna true se l'utente ha ALMENO UNO dei permessi
 */
export const canAny = (user, permissionList) => {
  return permissionList.some(perm => can(user, perm));
};

/**
 * Variante: canAll(user, permissionList)
 * Ritorna true solo se l'utente ha TUTTI i permessi
 */
export const canAll = (user, permissionList) => {
  return permissionList.every(perm => can(user, perm));
};

/**
 * Get lista permessi utente
 */
export const getUserPermissions = (user) => {
  return ROLE_PERMISSIONS[user?.role] || [];
};