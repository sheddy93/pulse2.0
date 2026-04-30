"use client";

import useSWR from "swr";
import { apiRequest } from "@/lib/api";

function buildQuery(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return query ? `?${query}` : "";
}

const fetcher = (path) => apiRequest(path);

export function useAttendanceWorkflow(params = {}) {
  const path = `/time/workflow-assistant/${buildQuery(params)}`;
  const { data, error, isLoading, mutate } = useSWR(path, fetcher);
  return { assistant: data || null, isLoading, isError: error, mutate };
}

export function useAttendanceReviewRows(params = {}) {
  const path = `/time/company/daily-review/${buildQuery(params)}`;
  const { data, error, isLoading, mutate } = useSWR(path, fetcher);
  return { rows: data || [], isLoading, isError: error, mutate };
}

export function useAttendanceOverview(params = {}) {
  const path = `/time/company/overview/${buildQuery(params)}`;
  const { data, error, isLoading, mutate } = useSWR(path, fetcher);
  return { rows: data || [], isLoading, isError: error, mutate };
}
