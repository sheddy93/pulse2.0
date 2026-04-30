'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest, getSessionToken } from '@/lib/api';

/**
 * Hook base per fetch dati generico con supporto per operazioni CRUD
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
 * Hook per lista richieste ferie/permessi
 * @param {Object} filters - Filtri opzionali { status, type, employee_id, company_id, start_date, end_date }
 * @returns {Object} { data, loading, error, refetch }
 */
export function useLeaveRequests(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.type) params.append('type', filters.type);
  if (filters.employee_id) params.append('employee_id', filters.employee_id);
  if (filters.company_id) params.append('company_id', filters.company_id);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  
  const queryString = params.toString();
  const endpoint = `/leave-requests/${queryString ? '?' + queryString : ''}`;
  
  return useApiFetch(endpoint);
}

/**
 * Hook per richieste ferie pendenti (da approvare)
 * @param {number|null} companyId - ID azienda opzionale
 * @returns {Object} { data, loading, error, refetch }
 */
export function usePendingLeaveRequests(companyId = null) {
  const params = new URLSearchParams({ status: 'pending' });
  if (companyId) params.append('company_id', companyId);
  
  return useApiFetch(`/leave-requests/?${params.toString()}`);
}

/**
 * Hook per statistiche ferie
 * @param {number|null} companyId - ID azienda opzionale
 * @param {number|null} year - Anno (default: anno corrente)
 * @returns {Object} { data, loading, error, refetch }
 */
export function useLeaveStats(companyId = null, year = null) {
  const params = new URLSearchParams();
  if (companyId) params.append('company_id', companyId);
  if (year) params.append('year', year);
  
  const endpoint = `/leave-requests/stats/${params.toString() ? '?' + params.toString() : ''}`;
  return useApiFetch(endpoint);
}

/**
 * Hook per azioni su richieste ferie (approva/rifiuta)
 * @returns {Object} { approve, reject, isLoading, error }
 */
export function useLeaveActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const approveRequest = useCallback(async (requestId, comments = null) => {
    if (!getSessionToken()) {
      setError('Non autenticato');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const body = comments ? { comments } : {};
      const result = await apiRequest(`/leave-requests/${requestId}/approve/`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rejectRequest = useCallback(async (requestId, reason = null) => {
    if (!getSessionToken()) {
      setError('Non autenticato');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const body = reason ? { reason } : {};
      const result = await apiRequest(`/leave-requests/${requestId}/reject/`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRequest = useCallback(async (requestData) => {
    if (!getSessionToken()) {
      setError('Non autenticato');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest('/leave-requests/', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    approve: approveRequest,
    reject: rejectRequest,
    create: createRequest,
    isLoading,
    error,
  };
}

/**
 * Hook per saldo ferie dipendente
 * @param {number|null} employeeId - ID dipendente (null per dipendente corrente)
 * @param {number|null} year - Anno
 * @returns {Object} { data, loading, error, refetch }
 */
export function useLeaveBalance(employeeId = null, year = null) {
  const params = new URLSearchParams();
  if (employeeId) params.append('employee_id', employeeId);
  if (year) params.append('year', year);
  
  const endpoint = `/leave-requests/balance/${params.toString() ? '?' + params.toString() : ''}`;
  return useApiFetch(endpoint);
}

// Export named exports per utilizzo individuale
export default {
  useLeaveRequests,
  usePendingLeaveRequests,
  useLeaveStats,
  useLeaveActions,
  useLeaveBalance,
};
