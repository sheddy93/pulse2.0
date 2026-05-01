import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { FileText, Calendar, Clock, Briefcase, ExternalLink, AlertCircle } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";

const CONTRACT_TYPES = {
  indeterminato: "Tempo Indeterminato",
  determinato: "Tempo Determinato",
  apprendistato: "Apprendistato",
  stage: "Stage/Tirocinio",
  collaborazione: "Collaborazione",
};

const STATUS_BADGE = {
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-red-100 text-red-700",
  terminated: "bg-slate-100 text-slate-500",
};

export default function EmployeeContract() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      const emp = emps[0];
      setEmployee(emp);
      if (emp) {
        const ctrs = await base44.entities.EmployeeContract.filter({ employee_id: emp.id });
        setContracts(ctrs.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)));
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="green" />;

  const activeContract = contracts.find(c => c.status === "active");
  const daysToExpiry = activeContract?.end_date
    ? differenceInDays(parseISO(activeContract.end_date), new Date())
    : null;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Il Mio Contratto</h1>
          <p className="text-sm text-slate-500">Visualizza i dettagli del tuo contratto di lavoro</p>
        </div>

        {!employee ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Profilo dipendente non trovato</p>
            <p className="text-sm text-slate-400 mt-1">Contatta il tuo responsabile HR</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nessun contratto disponibile</p>
            <p className="text-sm text-slate-400 mt-1">Il tuo contratto non è ancora stato caricato dal responsabile HR</p>
          </div>
        ) : (
          <>
            {/* Alert scadenza */}
            {daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry >= 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-800">
                  Il tuo contratto scade tra <strong>{daysToExpiry} giorni</strong>. Contatta il tuo responsabile HR.
                </p>
              </div>
            )}
            {daysToExpiry !== null && daysToExpiry < 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">
                  Il tuo contratto è <strong>scaduto</strong>. Contatta immediatamente il tuo responsabile HR.
                </p>
              </div>
            )}

            {/* Contratto attivo */}
            {activeContract && (
              <div className="bg-white rounded-xl border-2 border-emerald-200 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg text-slate-800">Contratto Attivo</h2>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[activeContract.status]}`}>
                    {activeContract.status === "active" ? "Attivo" : activeContract.status}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Briefcase className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Tipo Contratto</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {CONTRACT_TYPES[activeContract.contract_type] || activeContract.contract_type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Briefcase className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Mansione</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{activeContract.job_title || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Data Inizio</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {format(parseISO(activeContract.start_date), "d MMMM yyyy", { locale: it })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Data Fine</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {activeContract.end_date
                          ? format(parseISO(activeContract.end_date), "d MMMM yyyy", { locale: it })
                          : "Indeterminato"}
                      </p>
                    </div>
                  </div>

                  {activeContract.weekly_hours && (
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Clock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">Ore Settimanali</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{activeContract.weekly_hours}h</p>
                      </div>
                    </div>
                  )}

                  {activeContract.ccnl && (
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <FileText className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">CCNL</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{activeContract.ccnl}</p>
                      </div>
                    </div>
                  )}

                  {activeContract.level && (
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <FileText className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">Livello</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{activeContract.level}</p>
                      </div>
                    </div>
                  )}
                </div>

                {activeContract.document_url && (
                  <a
                    href={activeContract.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 w-fit"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Scarica documento contratto
                  </a>
                )}
              </div>
            )}

            {/* Storico contratti */}
            {contracts.filter(c => c.status !== "active").length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-800">Storico Contratti</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {contracts.filter(c => c.status !== "active").map(c => (
                    <div key={c.id} className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{CONTRACT_TYPES[c.contract_type] || c.contract_type}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {format(parseISO(c.start_date), "d MMM yyyy", { locale: it })}
                          {c.end_date ? ` → ${format(parseISO(c.end_date), "d MMM yyyy", { locale: it })}` : ""}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[c.status] || "bg-slate-100 text-slate-500"}`}>
                        {c.status === "expired" ? "Scaduto" : c.status === "terminated" ? "Terminato" : c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}