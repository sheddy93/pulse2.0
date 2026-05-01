import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Users, Clock, FileText, CalendarDays, TrendingUp, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";

export default function CompanyDashboard() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ employees: 0, pendingLeave: 0, pendingOvertime: 0, documents: 0, hasAdmin: false, hasConsultant: false, settingsComplete: false });
  const [showChecklist, setShowChecklist] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.company_id) {
        const [employees, leaves, overtime, docs, links, companies, allUsers] = await Promise.all([
          base44.entities.EmployeeProfile.filter({ company_id: me.company_id, status: "active" }),
          base44.entities.LeaveRequest.filter({ company_id: me.company_id, status: "pending" }),
          base44.entities.OvertimeRequest.filter({ company_id: me.company_id, status: "pending" }),
          base44.entities.Document.filter({ company_id: me.company_id }),
          base44.entities.ConsultantCompanyLink.filter({ company_id: me.company_id, status: "approved" }),
          base44.entities.Company.filter({ id: me.company_id }),
          base44.entities.User.list(),
        ]);
        const comp = companies[0];
        setCompany(comp);
        const adminUsers = allUsers.filter(u => u.company_id === me.company_id && ["company_admin", "hr_manager", "manager"].includes(u.role));
        const settingsComplete = !!(comp?.vat_number && comp?.email && comp?.phone && comp?.address);
        setStats({
          employees: employees.length,
          pendingLeave: leaves.length,
          pendingOvertime: overtime.length,
          documents: docs.filter(d => d.status === "in_revisione").length,
          hasAdmin: adminUsers.length > 0,
          hasConsultant: links.length > 0,
          settingsComplete,
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Aziendale</h1>
          <p className="text-sm text-slate-500">{company?.name || "Panoramica della tua azienda"}</p>
        </div>

        {showChecklist && stats.employees === 0 && (
          <OnboardingChecklist stats={stats} onDismiss={() => setShowChecklist(false)} />
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Dipendenti attivi", value: stats.employees, icon: Users, color: "text-blue-600 bg-blue-50" },
            { label: "Ferie in attesa", value: stats.pendingLeave, icon: CalendarDays, color: "text-orange-600 bg-orange-50" },
            { label: "Straordinari in attesa", value: stats.pendingOvertime, icon: Clock, color: "text-violet-600 bg-violet-50" },
            { label: "Documenti da rivedere", value: stats.documents, icon: FileText, color: "text-emerald-600 bg-emerald-50" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/dashboard/company/employees" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
            <div><p className="font-semibold text-slate-800">Dipendenti</p><p className="text-sm text-slate-500">Gestisci il personale</p></div>
          </Link>
          <Link to="/dashboard/company/leave-requests" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center"><Bell className="w-5 h-5 text-orange-600" /></div>
            <div><p className="font-semibold text-slate-800">Approvazioni</p><p className="text-sm text-slate-500">Ferie e permessi in attesa</p></div>
          </Link>
          <Link to="/dashboard/company/analytics" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="font-semibold text-slate-800">HR Analytics</p><p className="text-sm text-slate-500">Report e statistiche</p></div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}