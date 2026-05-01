/**
 * EmployeeMapper
 * ──────────────
 * Transforms between EmployeeProfile entity and internal domain model.
 * TODO MIGRATION: Swap implementation from Base44 to PostgreSQL
 */

import type { EmployeeProfile, EmployeeDTO } from '@/types/employee';

export class EmployeeMapper {
  /**
   * Map database entity to DTO (API response)
   */
  toPersistence(domain: EmployeeProfile) {
    return {
      id: domain.id,
      company_id: domain.company_id,
      first_name: domain.first_name,
      last_name: domain.last_name,
      email: domain.email,
      phone: domain.phone,
      employee_code: domain.employee_code,
      job_title: domain.job_title,
      department: domain.department,
      location: domain.location,
      manager: domain.manager,
      hire_date: domain.hire_date,
      status: domain.status,
      user_email: domain.user_email,
      has_account: domain.has_account,
      is_deleted: domain.is_deleted,
    };
  }

  /**
   * Map from DB to domain model
   */
  toDomain(raw: any): EmployeeProfile {
    return {
      id: raw.id,
      company_id: raw.company_id,
      first_name: raw.first_name,
      last_name: raw.last_name,
      email: raw.email,
      phone: raw.phone,
      employee_code: raw.employee_code,
      job_title: raw.job_title,
      department: raw.department,
      location: raw.location,
      manager: raw.manager,
      hire_date: new Date(raw.hire_date),
      status: raw.status,
      user_email: raw.user_email,
      has_account: raw.has_account,
      is_deleted: raw.is_deleted,
      created_date: new Date(raw.created_date),
      updated_date: new Date(raw.updated_date),
      created_by: raw.created_by,
    };
  }

  /**
   * Map to DTO (for API responses)
   */
  toDTO(domain: EmployeeProfile): EmployeeDTO {
    return {
      id: domain.id,
      name: `${domain.first_name} ${domain.last_name}`,
      email: domain.email,
      job_title: domain.job_title,
      department: domain.department,
      status: domain.status,
      hire_date: domain.hire_date.toISOString().split('T')[0],
    };
  }

  /**
   * TODO MIGRATION: Add PostgreSQL-specific mapping
   */
}