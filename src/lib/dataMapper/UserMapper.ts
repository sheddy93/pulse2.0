/**
 * UserMapper
 * ──────────
 * Maps User entity (built-in Base44 User).
 * TODO MIGRATION: Handle role enum changes for PostgreSQL
 */

import type { User } from '@/types/user';

export class UserMapper {
  toDomain(raw: any): User {
    return {
      id: raw.id,
      email: raw.email,
      full_name: raw.full_name,
      role: raw.role,
      company_id: raw.company_id,
      status: raw.status || 'active',
      must_change_password: raw.must_change_password || false,
      created_date: new Date(raw.created_date),
    };
  }

  toDTO(domain: User) {
    return {
      id: domain.id,
      email: domain.email,
      full_name: domain.full_name,
      role: domain.role,
      company_id: domain.company_id,
    };
  }
}