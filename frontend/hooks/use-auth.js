'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getSessionToken, getStoredUser, persistSession, clearSessionStorage } from '@/lib/api';

/**
 * Hook per gestione autenticazione
 * @returns {Object} { user, loading, isAuthenticated, login, logout, role, isAdmin, isConsultant, isCompanyUser, isEmployee }
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const token = getSessionToken();
      const storedUser = getStoredUser();

      if (token && storedUser) {
        // Verifica che il token sia ancora valido
        try {
          const freshUser = await apiRequest('/auth/me/');
          setUser(freshUser);
          setIsAuthenticated(true);
          // Aggiorna l'utente salvato
          persistSession(token, freshUser);
        } catch {
          // Token scaduto o non valido
          clearSessionStorage();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      setLoading(false);
    }

    checkAuth();
  }, []);

  /**
   * Effettua login
   * @param {string} email - Email dell'utente
   * @param {string} password - Password dell'utente
   * @returns {Object} Risposta del server con token e user
   */
  const login = useCallback(async (email, password) => {
    const response = await apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    persistSession(response.token, response.user);
    setUser(response.user);
    setIsAuthenticated(true);

    return response;
  }, []);

  /**
   * Effettua logout
   */
  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout/', { method: 'POST' });
    } catch {
      // Ignora errori durante il logout
    }

    clearSessionStorage();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Helper per ruoli
  const role = user?.role;
  const isAdmin = user?.is_platform_admin;
  const isConsultant = ['external_consultant', 'labor_consultant', 'safety_consultant'].includes(role);
  const isCompanyUser = ['company_owner', 'company_admin', 'hr_manager', 'manager'].includes(role);
  const isEmployee = role === 'employee';

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    role,
    isAdmin,
    isConsultant,
    isCompanyUser,
    isEmployee,
  };
}

/**
 * Hook per protezione route che richiedono autenticazione
 * @param {string[]} allowedRoles - Ruoli permessi per accedere alla pagina (se vuoto, tutti gli utenti autenticati)
 * @returns {Object} { user, loading, isAuthenticated }
 */
export function useRequireAuth(allowedRoles = []) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }

    if (!loading && isAuthenticated && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user?.role)) {
        router.push('/dashboard');
      }
    }
  }, [loading, isAuthenticated, user, router, allowedRoles]);

  return { user, loading, isAuthenticated };
}

/**
 * Hook per verifica permessi specifici
 * @param {string[]} requiredPermissions - Permessi richiesti
 * @returns {Object} { hasPermission, loading }
 */
export function usePermission(requiredPermissions = []) {
  const { user, loading } = useAuth();

  const hasPermission = useCallback(() => {
    if (!user || !requiredPermissions.length) return true;

    // Se l'utente e' admin, ha tutti i permessi
    if (user.is_platform_admin) return true;

    // Altrimenti verifica i permessi specifici
    const userPermissions = user.permissions || [];
    return requiredPermissions.every(perm => userPermissions.includes(perm));
  }, [user, requiredPermissions]);

  return {
    hasPermission: hasPermission(),
    loading,
  };
}

export default useAuth;
