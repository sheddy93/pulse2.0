import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Building2, Users, FileText, Link2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function ConsultantDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ companies: 0, pending: 0, documents: 0 });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const links = await base44.entities.ConsultantCompanyLink.filter({ consultant_email: me.email });
      const approved = links.filter(l => l.status === "approved");
      const pending = links.filter(l => l.status === "pending_consultant");
      setStats({ companies: approved.length, pending: pending.length, documents: 0 });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="violet" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Consulente</h1>
          <p className="text-sm text-slate-500">Benvenuto, {user?.full_name || user?.email}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Aziende collegate", value: stats.companies, icon: Building2, color: "text-violet-600 bg-violet-50" },
            { label: "Richieste in attesa", value: stats.pending, icon: Link2, color: "text-orange-600 bg-orange-50" },
            { label: "Documenti da rivedere", value: stats.documents, icon: FileText, color: "text-blue-600 bg-blue-50" },
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

        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/dashboard/consultant/link-requests" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-violet-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <Link2 className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Richieste collegamento</p>
              <p className="text-sm text-slate-500">Gestisci le richieste delle aziende</p>
            </div>
          </Link>
          <Link to="/dashboard/consultant/document-review" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 transition-colors flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Revisione Documenti</p>
              <p className="text-sm text-slate-500">Approva o rifiuta documenti aziendali</p>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}