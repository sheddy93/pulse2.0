import { useState, useEffect } from "react";
// Migration: removed base44 dependency
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import ManagerLeaveApprovalPanel from "@/components/company/ManagerLeaveApprovalPanel";

export default function ManagerLeaveRequests() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(me => {
      setUser(me);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="blue" />;

  if (user?.role !== "manager" && user?.role !== "admin") {
    return (
      <AppShell user={user}>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-800 font-semibold">Accesso riservato ai manager</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Approvazione Ferie</h1>
          <p className="text-sm text-slate-500">Gestisci le richieste ferie dei tuoi dipendenti</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <ManagerLeaveApprovalPanel
            managerEmail={user.email}
            companyId={user.company_id}
          />
        </div>
      </div>
    </AppShell>
  );
}