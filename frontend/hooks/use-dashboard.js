'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest, getSessionToken } from '@/lib/api';

/**
 * Hook base per fetch dati generico
 */
function useApiFetch(endpoint, options = {}) {
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!getSessionToken()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest(endpoint, options);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, options.method]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook per utente corrente
 * @returns {Object} { user, loading, error }
 */
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      if (!getSessionToken()) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest('/auth/me/');
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading, error };
}

/**
 * Hook per presenze oggi
 * @param {number|null} companyId - ID azienda opzionale per filtrare
 * @returns {Object} { data, loading, error, refetch }
 */
export function useTodayAttendance(companyId = null) {
  const endpoint = companyId ? `/time/today/?company=${companyId}` : '/time/today/';
  return useApiFetch(endpoint);
}

/**
 * Hook per overview mensile presenze
 * @param {number|null} month - Mese (1-12)
 * @param {number|null} year - Anno
 * @param {number|null} companyId - ID azienda opzionale
 * @returns {Object} { data, loading, error, refetch }
 */
export function useMonthlyOverview(month = null, year = null, companyId = null) {
  const params = [];
  if (month) params.push(`month=${month}`);
  if (year) params.push(`year=${year}`);
  if (companyId) params.push(`company=${companyId}`);
  const endpoint = `/time/company/overview/${params.length ? '?' + params.join('&') : ''}`;
  return useApiFetch(endpoint);
}

/**
 * Hook per riepilogo mensile presenze
 * @param {number|null} month - Mese (1-12)
 * @param {number|null} year - Anno
 * @returns {Object} { data, loading, error, refetch }
 */
export function useMonthlySummary(month = null, year = null) {
  const params = [];
  if (month) params.push(`month=${month}`);
  if (year) params.push(`year=${year}`);
  const endpoint = `/time/monthly-summary/${params.length ? '?' + params.join('&') : ''}`;
  return useApiFetch(endpoint);
}

/**
 * Hook per notifiche
 * @returns {Object} { data, loading, error, refetch }
 */
export function useNotifications() {
  return useApiFetch('/notifications/');
}

/**
 * Hook per conteggio notifiche non lette
 * @returns {Object} { data, loading, error, refetch }
 */
export function useUnreadNotifications() {
  return useApiFetch('/notifications/unread-count/', {
    initialData: { unread_count: 0 }
  });
}

/**
 * Hook per lista dipendenti
 * @param {number|null} companyId - ID azienda opzionale per filtrare
 * @returns {Object} { data, loading, error, refetch }
 */
export function useEmployees(companyId = null) {
  const endpoint = companyId ? `/employees/?company=${companyId}` : '/employees/';
  return useApiFetch(endpoint);
}

/**
 * Hook per dettaglio singolo dipendente
 * @param {number} employeeId - ID del dipendente
 * @returns {Object} { data, loading, error, refetch }
 */
export function useEmployee(employeeId) {
  return useApiFetch(`/employees/${employeeId}/`);
}

/**
 * Hook per tutte le aziende (super_admin only)
 * @returns {Object} { data, loading, error, refetch }
 */
export function useCompanies() {
  return useApiFetch('/companies/');
}

/**
 * Hook per azienda corrente (per company roles)
 * @returns {Object} { data, loading, error, refetch }
 */
export function useCurrentCompany() {
  return useApiFetch('/company/self/');
}

/**
 * Hook per aziende associate a un consulente
 * @returns {Object} { data, loading, error, refetch }
 */
export function useConsultantCompanies() {
  return useApiFetch('/time/consultant/companies/');
}

/**
 * Hook per overview azienda specifica per consulente
 * @param {number|null} companyId - ID azienda
 * @param {number|null} month - Mese (1-12)
 * @param {number|null} year - Anno
 * @returns {Object} { data, loading, error, refetch }
 */
export function useConsultantCompanyOverview(companyId, month, year) {
  const params = [];
  if (companyId) params.push(`company_id=${companyId}`);
  if (month) params.push(`month=${month}`);
  if (year) params.push(`year=${year}`);
  const endpoint = `/time/consultant/company-overview/${params.length ? '?' + params.join('&') : ''}`;
  return useApiFetch(endpoint);
}

/**
 * Hook per overview payroll azienda
 * @returns {Object} { data, loading, error, refetch }
 */
export function useCompanyPayroll() {
  return useApiFetch('/payroll/company/overview/');
}

/**
 * Hook per lista payroll
 * @returns {Object} { data, loading, error, refetch }
 */
export function usePayroll() {
  return useApiFetch('/payroll/');
}

/**
 * Hook per statistiche calcolate per la dashboard
 * @param {Object} user - Utente corrente
 * @param {Object} options - Opzioni aggiuntive
 * @returns {Object} { stats, loading, raw }
 */
export function useDashboardStats(user, options = {}) {
  const { data: todayData, loading: todayLoading } = useTodayAttendance();
  const { data: employeesData, loading: employeesLoading } = useEmployees();
  const { data: companyData, loading: companyLoading } = useCurrentCompany();

  const loading = todayLoading || employeesLoading || companyLoading;

  const stats = useCallback(() => {
    if (!user) return null;

    const role = user.role;

    // Base stats - comuni a tutti i ruoli
    const baseStats = {
      totalEmployees: employeesData?.length || 0,
      activeToday: todayData?.filter(e => e.state === 'checked_in')?.length || 0,
      onLeave: todayData?.filter(e => e.state === 'on_leave')?.length || 0,
    };

    // Stats specifiche per super_admin
    if (role === 'super_admin') {
      return {
        ...baseStats,
        pendingRequests: todayData?.filter(e => e.review_status === 'pending')?.length || 0,
        newHires: employeesData?.filter(e => {
          const created = new Date(e.created_at);
          const now = new Date();
          return now - created < 30 * 24 * 60 * 60 * 1000; // Ultimi 30 giorni
        })?.length || 0,
      };
    }

    // Stats per ruoli aziendali
    if (['company_owner', 'company_admin', 'hr_manager', 'manager'].includes(role)) {
      return {
        ...baseStats,
        pendingRequests: todayData?.filter(e => e.anomalies?.length > 0)?.length || 0,
      };
    }

    // Stats per consulenti
    if (['external_consultant', 'labor_consultant', 'safety_consultant'].includes(role)) {
      return {
        totalEmployees: employeesData?.length || 0,
        workingToday: todayData?.filter(e => e.state === 'checked_in')?.length || 0,
        pendingApprovals: todayData?.filter(e => e.review_status === 'pending')?.length || 0,
      };
    }

    // Stats base per employee
    return baseStats;
  }, [user, todayData, employeesData, companyData]);

  return {
    stats: stats(),
    loading,
    raw: { todayData, employeesData, companyData }
  };
}

// Export named exports per utilizzo individuale
export default {
  useCurrentUser,
  useTodayAttendance,
  useMonthlyOverview,
  useMonthlySummary,
  useNotifications,
  useUnreadNotifications,
  useEmployees,
  useEmployee,
  useCompanies,
  useCurrentCompany,
  useConsultantCompanies,
  useConsultantCompanyOverview,
  useCompanyPayroll,
  usePayroll,
  useDashboardStats,
};
