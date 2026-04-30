import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import AttendanceCalendar from "@/components/attendance/AttendanceCalendar";

export default function AttendanceCalendarPage() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      setEmployee(emps[0] || null);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="green" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calendario Presenze</h1>
          <p className="text-sm text-slate-500">Visualizza le tue presenze mensili</p>
        </div>

        {employee && (
          <AttendanceCalendar 
            employeeId={employee.id}
            companyId={employee.company_id}
          />
        )}
      </div>
    </AppShell>
  );
}