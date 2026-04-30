/**
 * PulseHR API Types
 * =================
 * Type definitions for the Django backend API responses and requests.
 */

// ============================================================
// USER TYPES
// ============================================================

export type UserRole =
  | 'super_admin'
  | 'company_owner'
  | 'company_admin'
  | 'hr_manager'
  | 'manager'
  | 'employee'
  | 'consultant';

export type UserType = 'COMPANY_USER' | 'CONSULTANT_USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  user_type: UserType;
  email_verified: boolean;
  created_at: string;
  force_password_change?: boolean;
  avatar_url?: string;
}

// ============================================================
// COMPANY TYPES
// ============================================================

export type CompanySize = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface Company {
  id: string;
  public_id: string;
  name: string;
  vat_number?: string;
  industry?: string;
  size?: CompanySize;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  subscription_tier?: string;
  max_employees?: number;
  current_employee_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// ============================================================
// EMPLOYEE TYPES
// ============================================================

export type EmploymentStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';

export interface Employee {
  id: string;
  user: User;
  company: Company;
  department?: string;
  position?: string;
  employment_status?: EmploymentStatus;
  hire_date?: string;
  termination_date?: string;
  salary?: number;
  salary_currency?: string;
  salary_frequency?: 'MONTHLY' | 'YEARLY';
  working_hours_per_week?: number;
  manager?: Employee;
  created_at: string;
  updated_at?: string;
}

// ============================================================
// LEAVE TYPES
// ============================================================

export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  user: User;
  employee?: Employee;
  company: Company;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  status: LeaveStatus;
  reason?: string;
  approved_by?: User;
  approved_at?: string;
  rejected_reason?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================
// ATTENDANCE TYPES
// ============================================================

export type TimeEntryType = 'CHECK_IN' | 'CHECK_OUT';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface TimeEntry {
  id: string;
  user: User;
  employee?: Employee;
  company: Company;
  entry_type: TimeEntryType;
  timestamp: string;
  location?: LocationCoords;
  notes?: string;
  device_info?: string;
  created_at: string;
}

// ============================================================
// DOCUMENT TYPES
// ============================================================

export type DocumentCategory =
  | 'CONTRACT'
  | 'ID_DOCUMENT'
  | 'CERTIFICATION'
  | 'PAYSLIP'
  | 'PERFORMANCE_REVIEW'
  | 'OTHER';

export interface Document {
  id: string;
  company: Company;
  employee?: Employee;
  uploaded_by: User;
  category: DocumentCategory;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================
// PAYROLL TYPES
// ============================================================

export type PayrollStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PAID' | 'CANCELLED';

export interface PayrollRun {
  id: string;
  company: Company;
  period_start: string;
  period_end: string;
  status: PayrollStatus;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  processed_by?: User;
  approved_by?: User;
  approved_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Payslip {
  id: string;
  employee: Employee;
  payroll_run: PayrollRun;
  base_salary: number;
  overtime_hours?: number;
  overtime_rate?: number;
  bonuses?: number;
  deductions: number;
  net_salary: number;
  payment_date?: string;
  bank_account_last4?: string;
  created_at: string;
}

// ============================================================
// ATTENDANCE WORKFLOW TYPES
// ============================================================

export type AttendanceReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AttendanceReview {
  id: string;
  company: Company;
  period_start: string;
  period_end: string;
  status: AttendanceReviewStatus;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  approved_by?: User;
  approved_at?: string;
  created_at: string;
}

// ============================================================
// COMPANY LIMITS & PRICING
// ============================================================

export interface CompanyLimits {
  max_employees: number;
  current_employees: number;
  features: string[];
  subscription_tier: string;
  expires_at?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_employees: number;
  features: string[];
  is_highlighted: boolean;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiError {
  error: boolean;
  message: string;
  fields?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  next?: string;
  previous?: string;
}

// ============================================================
// SEARCH TYPES
// ============================================================

export type SearchEntityType = 'employees' | 'documents' | 'companies';

export interface SearchResult {
  type: SearchEntityType;
  id: string;
  title: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  total_count: number;
}

// ============================================================
// SESSION TYPES
// ============================================================

export interface SessionUser extends User {
  company?: Company;
  employee_id?: string;
}

export interface Session {
  token: string;
  user: SessionUser;
  expires_at?: string;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR';

export interface Notification {
  id: string;
  user: User;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  created_at: string;
}