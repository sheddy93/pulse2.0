import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import AttendanceSummaryCard from '@/components/employee/AttendanceSummaryCard';
import PayrollDocumentsCard from '@/components/employee/PayrollDocumentsCard';
import LeaveBalanceCard from '@/components/employee/LeaveBalanceCard';
import { AlertCircle, FileText, Users } from 'lucide-react';

export default function MyDashboard() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [payrollDocs, setPayrollDocs] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (!me?.company_id) {
        window.location.href = '/';
        return;
      }
      setUser(me);

      try {
        // Fetch employee profile
        const employees = await base44.entities.EmployeeProfile.filter({
          company_id: me.company_id,
          email: me.email,
        });
        if (employees?.length > 0) {
          setEmployee(employees[0]);

          // Fetch this month's attendance
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const attendanceData = await base44.entities.AttendanceEntry.filter({
            employee_id: employees[0].id,
          });
          setAttendance(
            attendanceData?.filter(a => new Date(a.date) >= monthStart) || []
          );

          // Fetch payroll documents
          const payroll = await base44.entities.PayrollDocument.filter({
            employee_id: employees[0].id,
          }, '-month', 6);
          setPayrollDocs(payroll || []);

          // Fetch leave balance
          const balance = await base44.entities.LeaveBalance.filter({
            employee_id: employees[0].id,
          });
          if (balance?.length > 0) {
            setLeaveBalance(balance[0]);
          }
        }
      } catch (err) {
        console.error('Error loading employee data:', err);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!user || !employee) return null;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ciao, {user.full_name}! 👋</h1>
          <p className="text-slate-600 mt-1">Visualizza le tue presenze, ferie e buste paga in un solo posto</p>
        </div>

        {/* Quick Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Buste paga</p>
                <p className="text-2xl font-bold text-blue-700">{payrollDocs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-900">Ferie disponibili</p>
                <p className="text-2xl font-bold text-emerald-700">{leaveBalance?.available_leave || 0} gg</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-900">Permessi disponibili</p>
                <p className="text-2xl font-bold text-orange-700">{leaveBalance?.available_permissions || 0} gg</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AttendanceSummaryCard attendanceData={attendance} />
          </div>
          <div>
            <LeaveBalanceCard
              leaveBalance={leaveBalance}
              onRequestLeave={() => setShowLeaveForm(true)}
            />
          </div>
        </div>

        {/* Payroll Documents */}
        <PayrollDocumentsCard payrollDocs={payrollDocs} />

        {/* Leave Request Modal */}
        {showLeaveForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Richiedi Ferie</h3>
              <p className="text-sm text-slate-600">
                Vai alla pagina dedicata per richiedere una giornata di ferie o permessi
              </p>
              <div className="flex gap-3">
                <a
                  href="/dashboard/employee/leave"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-center hover:bg-blue-700 transition-colors"
                >
                  Apri pagina ferie
                </a>
                <button
                  onClick={() => setShowLeaveForm(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}