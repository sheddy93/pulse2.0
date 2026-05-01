/**
 * TimeEntryMapper
 * ───────────────
 * Maps attendance TimeEntry entity.
 */

import type { TimeEntry, TimeEntryDTO } from '@/types/attendance';

export class TimeEntryMapper {
  toPersistence(domain: TimeEntry) {
    return {
      id: domain.id,
      employee_id: domain.employee_id,
      company_id: domain.company_id,
      user_email: domain.user_email,
      timestamp: domain.timestamp,
      type: domain.type,
      latitude: domain.latitude,
      longitude: domain.longitude,
      location: domain.location,
    };
  }

  toDomain(raw: any): TimeEntry {
    return {
      id: raw.id,
      employee_id: raw.employee_id,
      employee_name: raw.employee_name,
      company_id: raw.company_id,
      user_email: raw.user_email,
      timestamp: new Date(raw.timestamp),
      type: raw.type,
      latitude: raw.latitude,
      longitude: raw.longitude,
      location: raw.location,
      ip_address: raw.ip_address,
      user_agent: raw.user_agent,
    };
  }

  toDTO(domain: TimeEntry): TimeEntryDTO {
    return {
      id: domain.id,
      timestamp: domain.timestamp.toISOString(),
      type: domain.type,
      location: domain.location,
    };
  }
}