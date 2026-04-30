import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { CalendarDays, AlertTriangle, ArrowLeft, ExternalLink } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { it } from "date-fns/locale";

const DOC_TYPES = { contratto: "Contratto", busta_paga: "Busta paga", certificato: "Certificato", corso: "Corso", altro: "Altro" };

function urgencyConfig(days) {
  if (days < 0) return { label: "Scaduto", cls: "bg-red-100 text-red-700 border-red-200", row: "bg-red-50" };
  if (days <= 7) return { label: `${days}gg`, cls: "bg-red-100 text-red-700 border-red-200", row: "bg-red-50" };
  if (days <= 30) return { label: `${days}gg`, cls: "bg-orange-100 text-orange-700 border-orange-200", row: "bg-orange-50" };
  return { label: `${days}gg`, cls: "bg-yellow-100 text-yellow-700 border-yellow-200", row: "bg-yellow-50/50" };
}

export default function ExpiryCalendar() {
  const [user, setUser] = useState(null);
  const [docs, setDocs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState(90); // days to show

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [allDocs, emps] = await Promise.all([
        base44.entities.Document.filter({ company_id: me.company_id }),
        base44.entities.EmployeeProfile.filter({ company_id: me.company_id }),
      ]);
      // Only docs with expiry date, sorted by expiry
      const withExpiry = allDocs
        .filter(d => d.expiry_date)
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
      setDocs(withExpiry);
      setEmployees(emps);
    }).finally(() => setLoading(false));
  }, []);

  const cutoff = addDays(new Date(), horizon);
  const filtered = docs.filter(d => new Date(d.expiry_date) <= cutoff);
  const expired = filtered.filter(d => differenceInDays(new Date(d.expiry_date), new Date()) < 0);
  const expiring = filtered.filter(d => differenceInDays(new Date(d.expiry_date), new Date()) >= 0);

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/company/documents" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Scadenzario documenti</h1>
            <p className="text-sm text-slate-500">{filtered.length} documenti con scadenza nel periodo selezionato</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-700">{expired.length}</p>
            <p className="text-sm text-red-600 mt-0.5">Scaduti</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-700">{filtered.filter(d => { const days = differenceInDays(new Date(d.expiry_date), new Date()); return days >= 0 && days <= 30; }).length}</p>
            <p className="text-sm text-orange-600 mt-0.5">Entro 30 giorni</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-700">{filtered.filter(d => { const days = differenceInDays(new Date(d.expiry_date), new Date()); return days > 30 && days <= horizon; }).length}</p>
            <p className="text-sm text-yellow-600 mt-0.5">Entro {horizon} giorni</p>
          </div>
        </div>

        {/* Horizon selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 font-medium">Mostra prossimi:</span>
          {[30, 60, 90, 180].map(d => (
            <button key={d} onClick={() => setHorizon(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${horizon === d ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {d}gg
            </button>
          ))}
        </div>

        {/* Document list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-14 text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nessun documento in scadenza</p>
            <p className="text-sm text-slate-400 mt-1">Ottimo! Tutti i documenti sono in regola nei prossimi {horizon} giorni.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Documento", "Tipo", "Dipendente", "Scadenza", "Giorni", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...expired, ...expiring].map(doc => {
                  const days = differenceInDays(new Date(doc.expiry_date), new Date());
                  const urg = urgencyConfig(days);
                  const emp = employees.find(e => e.id === doc.employee_id);
                  return (
                    <tr key={doc.id} className={urg.row}>
                      <td className="px-5 py-3 font-medium text-slate-800 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          {days <= 7 && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                          <span className="truncate">{doc.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{DOC_TYPES[doc.doc_type] || doc.doc_type}</td>
                      <td className="px-5 py-3 text-slate-500">{emp ? `${emp.first_name} ${emp.last_name}` : <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3 text-slate-700 font-medium">{format(new Date(doc.expiry_date), "d MMM yyyy", { locale: it })}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${urg.cls}`}>{urg.label}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors inline-block">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}