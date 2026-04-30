import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import { UserCog, Mail, Phone, MapPin, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function EmployeeProfile() {
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

  if (loading) return (
    <AppShell user={user}><div className="flex h-64 items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div></AppShell>
  );

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <h1 className="text-xl font-bold text-slate-800">Il mio profilo</h1>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700">
              {employee?.first_name?.[0]}{employee?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {employee ? `${employee.first_name} ${employee.last_name}` : user?.full_name || "—"}
              </h2>
              <p className="text-sm text-slate-500">{employee?.job_title || "—"}</p>
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                {employee?.status === "active" ? "Attivo" : employee?.status || "—"}
              </span>
            </div>
          </div>

          {!employee ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              Profilo dipendente non ancora configurato. Contatta HR.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Mail, label: "Email", value: employee.email },
                { icon: Phone, label: "Telefono", value: employee.phone },
                { icon: Briefcase, label: "Reparto", value: employee.department },
                { icon: MapPin, label: "Sede", value: employee.location },
                { icon: UserCog, label: "Responsabile", value: employee.manager },
                { icon: Calendar, label: "Data assunzione", value: employee.hire_date ? format(new Date(employee.hire_date), "d MMMM yyyy") : "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{label}</p>
                    <p className="text-sm text-slate-800 font-medium">{value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Account</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Email accesso</span>
              <span className="font-medium text-slate-800">{user?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Ruolo</span>
              <span className="font-medium text-slate-800 capitalize">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}