/**
 * User Types
 * ──────────
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COMPANY_OWNER = 'company_owner',
  COMPANY_ADMIN = 'company_admin',
  HR_MANAGER = 'hr_manager',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  CONSULTANT = 'consultant',
  EXTERNAL_CONSULTANT = 'external_consultant',
  LABOR_CONSULTANT = 'labor_consultant',
  SAFETY_CONSULTANT = 'safety_consultant',
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company_id?: string;
  status: string;
  must_change_password: boolean;
  created_date: Date;
}