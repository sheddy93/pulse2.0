"use client";

import { apiRequest, clearSessionStorage, getSessionToken, getStoredUser } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Cookie name for auth token
const AUTH_COOKIE_NAME = 'auth_token';

/**
 * Read authentication token from cookie.
 * @returns {string|null} Token or null
 */
function getAuthCookie() {
  if (typeof window === 'undefined') return null;
  const prefix = `${AUTH_COOKIE_NAME}=`;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

/**
 * Clear authentication cookie.
 */
function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export function AuthGuard({ children, allowedRoles }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState(() => ({
    loading: true,
    user: null,
    error: "",
  }));

  useEffect(() => {
    let cancelled = false;

    function redirectForUser(user) {
      if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
        router.replace("/");
        return true;
      }

      if (user.force_password_change && pathname !== "/settings/security") {
        router.replace("/settings/security");
        return true;
      }

      return false;
    }

    async function hydrateSession() {
      // Read token from cookie instead of localStorage
      const token = getAuthCookie();
      const storedUser = getStoredUser();

      if (!token) {
        clearSessionStorage();
        clearAuthCookie();
        router.replace("/login");
        return;
      }

      if (storedUser) {
        const shouldRedirect = redirectForUser(storedUser);
        if (!cancelled && !shouldRedirect) {
          setState({ loading: false, user: storedUser, error: "" });
        }
      }

      try {
        const user = await apiRequest("/auth/me/");
        const serializedUser = JSON.stringify(user);
        // Store user in localStorage for getStoredUser() backward compatibility
        // but don't store the token there anymore
        window.localStorage.setItem("hr_user", serializedUser);
        window.sessionStorage.setItem("hr_user", serializedUser);

        const shouldRedirect = redirectForUser(user);

        if (!cancelled && !shouldRedirect) {
          setState({ loading: false, user, error: "" });
        }
      } catch (error) {
        clearSessionStorage();
        clearAuthCookie();
        if (!cancelled) {
          setState({ loading: false, user: null, error: error.message });
        }
        router.replace("/login");
      }
    }

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [allowedRoles, pathname, router]);

  if (state.loading) {
    return <div className="panel"><p className="text-sm text-slate-400">Loading workspace...</p></div>;
  }

  if (!state.user) {
    return null;
  }

  return children;
}
