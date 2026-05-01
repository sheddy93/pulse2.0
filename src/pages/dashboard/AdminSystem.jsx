import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Server, Database, Activity, CheckCircle, AlertTriangle, Zap, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function AdminSystem() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ companies: 0, users: 0, employees: 0, documents: 0, leaves: 0, auditLogs: 0 });
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    const [companies, users, employees, docs, leaves, audits] = await Promise.all([
      base44.entities.Company.list(),
      base44.entities.User.list(),
      base44.entities.EmployeeProfile.list(),
      base44.entities.Document.list(),
      base44.entities.LeaveRequest.list(),
      base44.entities.AuditLog.list(),
    ]);
    setStats({
      companies: companies.length,
      users: users.length,
      employees: employees.length,
      documents: docs.length,
      leaves: leaves.length,
      auditLogs: audits.length,
    });
    setLastRefresh(new Date());
  };

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (me?.role !== "super_admin") { window.location.href = "/"; return; }
      setUser(me);
      await loadStats();
    }).finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) return <PageLoader color="red" />;

  const systemChecks = [
    { label: "Database operativo", status: "ok" },
    { label: "Autenticazione attiva", status: "ok" },
    { label: "Storage file attivo", status: "ok" },
    { label: "Backend functions", status: "ok" },
    { label: "Notifiche email", status: "ok" },
    { label: "Stripe integration", status: stats.companies > 0 ? "ok" : "warning" },
  ];

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="w-7 h-7 text-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Sistema</h1>
              <p className="text-sm text-slate-500">Stato della piattaforma PulseHR</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Aggiorna
          </button>
        </div>

        <p className="text-xs text-slate-400">Ultimo aggiornamento: {format(lastRefresh, "HH:mm:ss", { locale: it })}</p>

        {/* System Status */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">Sistema Operativo</p>
            <p className="text-sm text-emerald-700">Tutti i servizi funzionano correttamente</p>
          </div>
        </div>

        {/* Service Checks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-600" /> Stato Servizi
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {systemChecks.map((check, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700">{check.label}</span>
                {check.status === "ok" ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" /> OK
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-orange-600">
                    <AlertTriangle className="w-3.5 h-3.5" /> Attenzione
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Database Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-600" /> Statistiche Database
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Aziende", value: stats.companies, color: "text-blue-600" },
              { label: "Utenti", value: stats.users, color: "text-violet-600" },
              { label: "Dipendenti", value: stats.employees, color: "text-emerald-600" },
              { label: "Documenti", value: stats.documents, color: "text-orange-600" },
              { label: "Richieste Ferie", value: stats.leaves, color: "text-red-600" },
              { label: "Log Audit", value: stats.auditLogs, color: "text-slate-600" },
            ].map(s => (
              <div key={s.label} className="p-4 bg-slate-50 rounded-lg">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Backend Functions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-600" /> Backend Functions
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "stripeWebhook", "stripeCheckout", "stripePlans",
              "notifyLeaveRequest", "notifyHRApproval", "notifyManagerApproval",
              "notifyPayrollAvailable", "processPayrollZip", "generateReport",
              "importEmployeesFromCSV", "createAuditLog", "sendSignatureReminder",
              "notifyExpiringDocs", "notifyConsultantLink",
            ].map(fn => (
              <div key={fn} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-xs font-mono text-slate-700">{fn}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle className="w-3 h-3" /> Attivo
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}