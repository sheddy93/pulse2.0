import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { AlertCircle, Clock, CheckCircle2, Filter } from "lucide-react";
import { format, parseISO, differenceInDays, isPast } from "date-fns";
import { it } from "date-fns/locale";

const URGENCY = {
  expired: { label: "Scaduto", color: "bg-red-100 text-red-700", icon: AlertCircle },
  urgent: { label: "Entro 30 giorni", color: "bg-orange-100 text-orange-700", icon: Clock },
  upcoming: { label: "Entro 90 giorni", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  active: { label: "Attivo", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 }
};

export default function CertificationExpiry() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);

      if (!me.company_id) {
        setLoading(false);
        return;
      }

      const [skills, trainingPlan] = await Promise.all([
        base44.entities.EmployeeSkill.filter({ company_id: me.company_id }),
        base44.entities.TrainingPlan.filter({ company_id: me.company_id })
      ]);

      // Mappa skills con scadenza
      const skillItems = skills
        .filter(s => s.expiry_date && s.status !== "expired")
        .map(s => ({
          type: "skill",
          id: s.id,
          name: s.skill_name,
          employee_name: s.employee_name,
          employee_id: s.employee_id,
          expiry_date: s.expiry_date,
          issued_by: s.issuer
        }));

      // Aggiungi corsi da piani con scadenze
      const courseItems = trainingPlan
        .flatMap(p => (p.courses || []).map(c => ({
          ...c,
          employee_name: p.employee_name,
          employee_id: p.employee_id,
          plan_title: p.title
        })))
        .filter(c => c.target_completion_date && c.status !== "completed")
        .map(c => ({
          type: "course",
          id: c.course_id,
          name: c.course_name,
          employee_name: c.employee_name,
          employee_id: c.employee_id,
          expiry_date: c.target_completion_date,
          plan_title: c.plan_title
        }));

      const allItems = [...skillItems, ...courseItems].sort((a, b) =>
        new Date(a.expiry_date) - new Date(b.expiry_date)
      );

      setItems(allItems);
    }).finally(() => setLoading(false));
  }, []);

  const getUrgency = (expiryDate) => {
    if (isPast(parseISO(expiryDate))) return "expired";
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days <= 30) return "urgent";
    if (days <= 90) return "upcoming";
    return "active";
  };

  const filtered = filter === "all" ? items : items.filter(item => getUrgency(item.expiry_date) === filter);

  const stats = {
    expired: items.filter(i => getUrgency(i.expiry_date) === "expired").length,
    urgent: items.filter(i => getUrgency(i.expiry_date) === "urgent").length,
    upcoming: items.filter(i => getUrgency(i.expiry_date) === "upcoming").length
  };

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Scadenziario Certificazioni</h1>
          <p className="text-slate-600 mt-2">Monitora le scadenze di competenze, certificazioni e corsi</p>
        </div>

        {/* Alert */}
        {stats.expired > 0 && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">{stats.expired} certificazioni scadute</p>
              <p className="text-sm text-red-800 mt-1">Richiedi il rinnovo o la formazione necessaria</p>
            </div>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Scaduti</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.expired}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Entro 30 giorni</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.urgent}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Entro 90 giorni</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.upcoming}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Totale</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{items.length}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {["all", "expired", "urgent", "upcoming"].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status === "all" ? "Tutti" : status === "expired" ? "Scaduti" : status === "urgent" ? "Urgenti" : "Prossimi"}
            </button>
          ))}
        </div>

        {/* Tabella */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Niente da mostrare</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Elemento</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Dipendente</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Scadenza</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Giorni</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Status</th>
                    <th className="text-left px-6 py-3 font-semibold text-slate-700">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(item => {
                    const urgency = getUrgency(item.expiry_date);
                    const days = differenceInDays(parseISO(item.expiry_date), new Date());
                    const config = URGENCY[urgency];
                    const Icon = config.icon;

                    return (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50">
                        <td className="px-6 py-3">
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            {item.plan_title && <p className="text-xs text-slate-500">Piano: {item.plan_title}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-slate-700">{item.employee_name}</td>
                        <td className="px-6 py-3">
                          <p className="font-semibold text-slate-900">
                            {format(parseISO(item.expiry_date), "d MMM yyyy", { locale: it })}
                          </p>
                        </td>
                        <td className="px-6 py-3">
                          <p className={`font-bold ${days < 0 ? "text-red-600" : days <= 30 ? "text-orange-600" : "text-slate-600"}`}>
                            {days < 0 ? `${Math.abs(days)}gg fa` : `${days}gg`}
                          </p>
                        </td>
                        <td className="px-6 py-3">
                          <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${config.color} w-fit`}>
                            <Icon className="w-4 h-4" />
                            <span className="text-xs font-semibold">{config.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <button className="text-blue-600 hover:text-blue-700 font-semibold text-xs">
                            Notifica
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}