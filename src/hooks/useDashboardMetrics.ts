/**
 * Dashboard Metrics Hook
 * ────────────────────
 * Real-time KPI fetching with auto-refresh.
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useDashboardMetrics(companyId: string, metrics: string[], refreshInterval: number = 300) {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const results: Record<string, any> = {};

        for (const metric of metrics) {
          switch (metric) {
            case 'employees_count':
              const employees = await base44.entities.EmployeeProfile.filter({
                company_id: companyId,
                status: 'active',
              });
              results.employees_count = employees.length;
              break;

            case 'leave_pending_count':
              const pendingLeaves = await base44.entities.LeaveRequest.filter({
                company_id: companyId,
                status: 'pending',
              });
              results.leave_pending_count = pendingLeaves.length;
              break;

            case 'overtime_total':
              const overtimeRequests = await base44.entities.OvertimeRequest.filter({
                company_id: companyId,
              });
              results.overtime_total = overtimeRequests.reduce((sum, o) => sum + (o.hours || 0), 0);
              break;

            case 'attendance_rate':
              // TODO: Calculate attendance rate
              results.attendance_rate = 92.5;
              break;
          }
        }

        setData(results);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [companyId, metrics, refreshInterval]);

  return { data, loading };
}