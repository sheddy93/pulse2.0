/**
 * Attendance Types
 * ────────────────
 */

export enum TimeEntryType {
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
  BREAK_START = 'break_start',
  BREAK_END = 'break_end',
}

export interface TimeEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  company_id: string;
  user_email: string;
  timestamp: Date;
  type: TimeEntryType;
  latitude?: number;
  longitude?: number;
  location?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface TimeEntryDTO {
  id: string;
  timestamp: string;
  type: TimeEntryType;
  location?: string;
}

export interface AttendanceSummary {
  employee_id: string;
  date: Date;
  check_in?: TimeEntry;
  check_out?: TimeEntry;
  breaks: TimeEntry[];
  total_hours: number;
}