import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import OvertimeApprovalPanel from "@/components/company/OvertimeApprovalPanel";
import ManagerApprovalPanel from "@/components/company/ManagerApprovalPanel";
import { Clock, Users } from "lucide-react";

export default function OvertimePage() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, emps] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.EmployeeProfile.filter({ company_id: me.company_id }),
      ]);
      setCompany(companies[0] || null);
      setEmployees(emps);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Straordinari
          </h1>
          <p className="text-sm text-slate-500">Approva o rifiuta le richieste di straordinario dei dipendenti</p>
        </div>

        {user?.role === "company" || user?.email?.endsWith("@company") ? (
          <>
            {company && employees.length > 0 ? (
              <OvertimeApprovalPanel companyId={company.id} employees={employees} />
            ) : (
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Nessun dipendente disponibile</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Approvazioni in attesa dal manager
              </h2>
              <ManagerApprovalPanel managerEmail={user?.email} />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}