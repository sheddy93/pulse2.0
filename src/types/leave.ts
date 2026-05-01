/**
 * Leave Request Types
 * ───────────────────
 */

export enum LeaveType {
  FERIE = 'ferie',
  PERMESSO = 'permesso',
  MALATTIA = 'malattia',
  EXTRA = 'extra',
  ROL = 'ROL',
  STRAORDINARIO_RECUPERO = 'straordinario_recupero',
}

export enum LeaveStatus {
  PENDING = 'pending',
  MANAGER_APPROVED = 'manager_approved',
  MANAGER_REJECTED = 'manager_rejected',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  company_id: string;
  employee_name: string;
  employee_email: string;
  leave_type: LeaveType;
  start_date: Date;
  end_date: Date;
  days_count: number;
  note?: string;
  status: LeaveStatus;
  manager_email?: string;
  manager_name?: string;
  manager_approved_at?: Date | null;
  manager_note?: string;
  admin_email?: string;
  admin_name?: string;
  reviewed_at?: Date | null;
  admin_note?: string;
  created_date: Date;
  created_by: string;
}

export interface LeaveRequestDTO {
  id: string;
  employee_name: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  status: LeaveStatus;
}

export interface LeaveBalance {
  employee_id: string;
  company_id: string;
  available_leave: number;
  used_leave: number;
  available_permissions: number;
  used_permissions: number;
  year: number;
}