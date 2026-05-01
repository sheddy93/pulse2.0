/**
 * LeaveRequestMapper
 * ──────────────────
 * Maps LeaveRequest entity between persistence and domain layers.
 */

import type { LeaveRequest, LeaveRequestDTO } from '@/types/leave';

export class LeaveRequestMapper {
  toPersistence(domain: LeaveRequest) {
    return {
      id: domain.id,
      employee_id: domain.employee_id,
      company_id: domain.company_id,
      leave_type: domain.leave_type,
      start_date: domain.start_date,
      end_date: domain.end_date,
      days_count: domain.days_count,
      status: domain.status,
      manager_email: domain.manager_email,
      admin_email: domain.admin_email,
    };
  }

  toDomain(raw: any): LeaveRequest {
    return {
      id: raw.id,
      employee_id: raw.employee_id,
      company_id: raw.company_id,
      employee_name: raw.employee_name,
      employee_email: raw.employee_email,
      leave_type: raw.leave_type,
      start_date: new Date(raw.start_date),
      end_date: new Date(raw.end_date),
      days_count: raw.days_count,
      note: raw.note,
      status: raw.status,
      manager_email: raw.manager_email,
      manager_name: raw.manager_name,
      manager_approved_at: raw.manager_approved_at ? new Date(raw.manager_approved_at) : null,
      manager_note: raw.manager_note,
      admin_email: raw.admin_email,
      admin_name: raw.admin_name,
      reviewed_at: raw.reviewed_at ? new Date(raw.reviewed_at) : null,
      admin_note: raw.admin_note,
      created_date: new Date(raw.created_date),
      created_by: raw.created_by,
    };
  }

  toDTO(domain: LeaveRequest): LeaveRequestDTO {
    return {
      id: domain.id,
      employee_name: domain.employee_name,
      leave_type: domain.leave_type,
      start_date: domain.start_date.toISOString().split('T')[0],
      end_date: domain.end_date.toISOString().split('T')[0],
      days_count: domain.days_count,
      status: domain.status,
    };
  }
}