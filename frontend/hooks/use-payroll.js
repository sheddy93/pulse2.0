"use client";

import useSWR from "swr";
import { apiRequest } from "@/lib/api";

/**
 * Payroll hooks aligned to the real Django endpoints.
 * Important: keep these paths in sync with backend/users/urls.py.
 */

function buildQuery(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return query ? `?${query}` : "";
}

function getOverviewPath(role, params = {}) {
  const query = buildQuery(params);
  if (role === "consultant") return `/payroll/consultant/overview/${query}`;
  if (role === "company" || role === "admin") return `/payroll/company/overview/${query}`;
  if (role === "employee") return `/payroll/employee/mine/${query}`;
  return `/payroll/${query}`;
}

const fetcher = (path) => apiRequest(path);

export function usePayrollRuns(role = "company", params = {}) {
  const path = getOverviewPath(role, params);
  const { data, error, isLoading, mutate } = useSWR(path, fetcher);
  const payload = data || {};
  const payrollRuns = Array.isArray(payload) ? payload : payload.runs || [];
  const summary = Array.isArray(payload) ? null : payload.summary || null;
  return { payrollRuns, summary, isLoading, isError: error, mutate };
}

export function usePayrollDetail(payrollId) {
  const path = payrollId ? `/payroll/${payrollId}/` : null;
  const { data, error, isLoading, mutate } = useSWR(path, fetcher);
  return { payroll: data || null, isLoading, isError: error, mutate };
}

export function usePayrollDocuments(payrollId) {
  const path = payrollId ? `/payroll/${payrollId}/documents/` : null;
  const { data, error, isLoading, mutate } = useSWR(path, fetcher);
  return { documents: data || [], isLoading, isError: error, mutate };
}

export function usePayrollAssistant(role = "company", params = {}) {
  const path = `/payroll/assistant/${buildQuery({ role, ...params })}`;
  const { data, error, isLoading, mutate } = useSWR(path, fetcher);
  return { assistant: data || null, isLoading, isError: error, mutate };
}
