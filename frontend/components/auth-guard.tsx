"use client";

import { apiRequest, clearSessionStorage, getSessionToken, getStoredUser } from "@/lib/api";
import type { SessionUser, UserRole } from "@/types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

// Cookie name for auth token
const AUTH_COOKIE_NAME = 'auth_token';

// ============================================================
// TYPES
// ============================================================

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

interface AuthState {
  loading: boolean;
  user: SessionUser | null;
  error: string;
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

/**
 * Read authentication token from multiple sources.
 * Tries: cookie (primary, set by backend) → localStorage (fallback)
 * @returns Token or null
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try cookie first (set by backend with HttpOnly)
  const prefix = `${AUTH_COOKIE_NAME}=`;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  
  // Fallback to localStorage (set by login page)
  return window.localStorage.getItem('auth_token') || window.sessionStorage.getItem('auth_token');
}

/**
 * Clear authentication cookie.
 */
function clearAuthCookie(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

// ============================================================
// AUTH GUARD COMPONENT
// ============================================================

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>(() => ({
    loading: true,
    user: null,
    error: "",
  }));

  const redirectForUser = useCallback((user: SessionUser): boolean => {
    // Check role-based access
    if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
      router.replace("/");
      return true;
    }

    // Check if password change is required
    if (user.force_password_change && pathname !== "/settings/security") {
      router.replace("/settings/security");
      return true;
    }

    return false;
  }, [allowedRoles, pathname, router]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession(): Promise<void> {
      // Read token from cookie first, then localStorage fallback
      const token = getAuthToken();
      const storedUser = getStoredUser();

      if (!token) {
        clearSessionStorage();
        clearAuthCookie();
        router.replace("/login");
        return;
      }

      // Check stored user first for faster initial render
      if (storedUser) {
        const shouldRedirect = redirectForUser(storedUser);
        if (!cancelled && !shouldRedirect) {
          setState({ loading: false, user: storedUser, error: "" });
        }
      }

      // Fetch fresh user data from API
      try {
        const user = await apiRequest<SessionUser>("/auth/me/");
        const serializedUser = JSON.stringify(user);

        // Store user in localStorage for getStoredUser() backward compatibility
        // and also in 'user' key for consistency with login page
        window.localStorage.setItem("hr_user", serializedUser);
        window.sessionStorage.setItem("hr_user", serializedUser);
        window.localStorage.setItem("user", serializedUser); // Primary key for new code
        window.sessionStorage.setItem("user", serializedUser);

        const shouldRedirect = redirectForUser(user);

        if (!cancelled && !shouldRedirect) {
          setState({ loading: false, user, error: "" });
        }
      } catch (error) {
        clearSessionStorage();
        clearAuthCookie();
        if (!cancelled) {
          const errorMessage = error instanceof Error ? error.message : "Authentication failed";
          setState({ loading: false, user: null, error: errorMessage });
        }
        router.replace("/login");
      }
    }

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [redirectForUser, router]);

  // Show loading state
  if (state.loading) {
    return (
      <div className="panel">
        <p className="text-sm text-slate-400">Loading workspace...</p>
      </div>
    );
  }

  // If no user, return null (will redirect)
  if (!state.user) {
    return null;
  }

  // Render children with authenticated user context
  return <>{children}</>;
}

export default AuthGuard;