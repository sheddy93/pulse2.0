import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { CheckCircle2, Clock, AlertCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const STATUS_COLORS = {
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-yellow-100 text-yellow-700"
};

export default function OnboardingTracking() {
  const [user, setUser] = useState(null);
  const [onboardings, setOnboardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);

      if (!me.company_id) {
        setLoading(false);
        return;
      }

      const onbs = await base44.entities.OnboardingProgress.filter({
        company_id: me.company_id
      });

      setOnboardings(onbs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" 
    ? onboardings 
    : onboardings.filter(o => o.status === filter);

  const stats = {
    total: onboardings.length,
    completed: onboardings.filter(o => o.status === "completed").length,
    in_progress: onboardings.filter(o => o.status === "in_progress").length,
    on_hold: onboardings.filter(o => o.status === "on_hold").length
  };

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tracciamento Onboarding</h1>
          <p className="text-slate-600 mt-2">Monitora il progresso di onboarding dei nuovi dipendenti</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Totale</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">Completati</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">In Progress</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.in_progress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase">In Hold</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.on_hold}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {["all", "in_progress", "completed", "on_hold"].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status === "all" ? "Tutti" : status === "in_progress" ? "In Progress" : status === "completed" ? "Completati" : "In Hold"}
            </button>
          ))}
        </div>

        {/* Tabella */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nessun onboarding trovato</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Dipendente</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Step</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Avanzamento</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Stato</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Data Inizio</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(onb => (
                    <tr key={onb.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{onb.employee_name}</p>
                          <p className="text-xs text-slate-500">{onb.employee_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-semibold text-slate-800">{onb.current_step}/4</span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full transition-all"
                              style={{ width: `${onb.overall_progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{onb.overall_progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[onb.status]}`}>
                          {onb.status === "in_progress" ? "In Progress" : onb.status === "completed" ? "Completato" : "In Hold"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {onb.started_at ? format(new Date(onb.started_at), "d MMM yyyy", { locale: it }) : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                          Visualizza →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}