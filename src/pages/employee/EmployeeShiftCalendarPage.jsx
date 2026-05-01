import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import EmployeeShiftCalendar from '@/components/shifts/EmployeeShiftCalendar';

export default function EmployeeShiftCalendarPage() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }

      const emps = await base44.entities.EmployeeProfile.filter({
        user_email: me.email
      });
      setEmployee(emps[0]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="green" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">I Miei Turni</h1>
          <p className="text-sm text-slate-500">Visualizza il tuo calendario di turni</p>
        </div>

        {employee && (
          <EmployeeShiftCalendar
            employeeId={employee.id}
            companyId={employee.company_id}
          />
        )}
      </div>
    </AppShell>
  );
}