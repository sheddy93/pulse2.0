/**
 * PulseHR Session & Auth Types
 * ============================
 * Type definitions for authentication and session management.
 * Note: PulseHR uses token-based auth via cookies, not NextAuth.
 */

import type { User, Company, SessionUser } from './api';

// ============================================================
// AUTH GUARD TYPES
// ============================================================

export interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<User['role']>;
}

export interface AuthState {
  loading: boolean;
  user: SessionUser | null;
  error: string;
}

// ============================================================
// SESSION STORAGE TYPES
// ============================================================

export interface StoredSession {
  token: string;
  user: SessionUser;
  expires_at?: string;
}

// ============================================================
// API REQUEST OPTIONS
// ============================================================

export interface ApiRequestOptions extends RequestInit {
  responseType?: 'json' | 'blob' | 'text';
}

// ============================================================
// HOOK RETURN TYPES
// ============================================================

export interface UseAuthReturn {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export interface UseLeaveRequestsReturn {
  requests: import('./api').LeaveRequest[];
  isLoading: boolean;
  error: string | null;
  createRequest: (data: Partial<import('./api').LeaveRequest>) => Promise<void>;
  approveRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string, reason: string) => Promise<void>;
}

export interface UseDashboardReturn {
  data: import('./api').Dashboard | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ============================================================
// DASHBOARD TYPES
// ============================================================

export interface Dashboard {
  summary: {
    total_employees: number;
    active_employees: number;
    on_leave_today: number;
    pending_leave_requests: number;
  };
  recent_activity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  quick_stats: Array<{
    label: string;
    value: string | number;
    change?: number;
  }>;
}