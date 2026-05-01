/**
 * Hook per dashboard KPIs real-time
 * Carica e aggiorna automaticamente metriche critiche
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useDashboardKPIs(companyId) {
  const [kpis, setKpis] = useState({
    totalEmployees: 0,
    activeToday: 0,
    leaveRequestsPending: 0,
    overtimePending: 0,
    attendanceRate: 0,
    expensesPending: 0,
    documentsPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadKPIs = async () => {
    try {
      setLoading(true);

      // Carica dipendenti totali
      const employees = await base44.entities.EmployeeProfile.filter({
        company_id: companyId,
        status: 'active'
      });

      // Carica presenze di oggi
      const today = new Date().toISOString().split('T')[0];
      const attendance = await base44.entities.AttendanceEntry.filter({
        company_id: companyId,
        attendance_date: today,
      });

      // Carica ferie in sospeso
      const leaveRequests = await base44.entities.LeaveRequest.filter({
        company_id: companyId,
        status: 'pending'
      });

      // Carica straordinari in sospeso
      const overtimes = await base44.entities.OvertimeRequest.filter({
        company_id: companyId,
        status: 'pending'
      });

      // Carica spese in sospeso
      const expenses = await base44.entities.ExpenseReimbursement.filter({
        company_id: companyId,
        status: 'pending'
      });

      // Carica documenti in attesa di firma
      const documents = await base44.entities.Document.filter({
        company_id: companyId,
        signature_required: true,
        signature_status: 'pending'
      });

      // Calcola tasso di presenza
      const attendanceRate = employees.length > 0
        ? Math.round((attendance.length / employees.length) * 100)
        : 0;

      setKpis({
        totalEmployees: employees.length,
        activeToday: new Set(attendance.map(a => a.employee_id)).size,
        leaveRequestsPending: leaveRequests.length,
        overtimePending: overtimes.length,
        attendanceRate,
        expensesPending: expenses.length,
        documentsPending: documents.length,
      });

      setError(null);
    } catch (err) {
      console.error('Failed to load KPIs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKPIs();

    // Aggiorna KPI ogni 30 secondi
    const interval = setInterval(loadKPIs, 30000);
    return () => clearInterval(interval);
  }, [companyId]);

  return { kpis, loading, error, refetch: loadKPIs };
}

// Hook per KPI singolo
export function useKPI(companyId, metricName) {
  const { kpis, loading } = useDashboardKPIs(companyId);
  return {
    value: kpis[metricName] || 0,
    loading
  };
}