/**
 * Employee Types
 * ──────────────
 * Domain models for employee management.
 * These types are persistence-agnostic.
 */

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ONBOARDING = 'onboarding',
}

export interface EmployeeProfile {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employee_code: string;
  job_title: string;
  department?: string;
  location?: string;
  manager?: string;
  hire_date: Date;
  status: EmployeeStatus;
  user_email?: string;
  has_account: boolean;
  is_deleted: boolean;
  created_date: Date;
  updated_date: Date;
  created_by: string;
}

export interface EmployeeDTO {
  id: string;
  name: string;
  email: string;
  job_title: string;
  department?: string;
  status: EmployeeStatus;
  hire_date: string;
}

export interface CreateEmployeeInput {
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department?: string;
  hire_date: Date;
}

export interface UpdateEmployeeInput {
  job_title?: string;
  department?: string;
  status?: EmployeeStatus;
}