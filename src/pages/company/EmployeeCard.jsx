import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { User, Clock, FileText, Calendar, Briefcase, StickyNote, ArrowLeft, Phone, Mail, MapPin, Building2, Hash } from "lucide-react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

const STATUS_BADGE = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
  onboarding: "bg-blue-100 text-blue-700",
};

const DOC_TYPE_LABELS = { contratto: "Contratto", busta_paga: "Busta paga", certificato: "Certificato", corso: "Corso", altro: "Altro" };
const LEAVE_STATUS = { pending: "In attesa", approved: "Approvata", rejected: "Rifiutata", manager_approved: "App. Manager" };
const CONTRACT_TYPES = { indeterminato: "Tempo Indeterminato", determinato: "Tempo Determinato", apprendistato: "Apprendistato", stage: "Stage", collaborazione: "Collaborazione" };

const TABS = [
  { id: "profile", label: "Profilo", icon: User },
  { id: "attendance", label: "Presenze", icon: Clock },
  { id: "contract", label: "Contratto", icon: Briefcase },
  { id: "documents", label: "Documenti", icon: FileText },
  { id: "leaves", label: "Ferie", icon: Calendar },
  { id: "notes", label: "Note", icon: StickyNote },
];

export default function EmployeeCard() {
  const { id } = useParams();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("profile");
  const [timeEntries, setTimeEntries] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const backPath = location.pathname.includes("/consultant") ? "/dashboard/consultant/employees" : "/dashboard/company/employees";

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ id });
      const emp = emps[0];
      setEmployee(emp);
      if (emp) {
        const [entries, ctrs, docs, lvs] = await Promise.all([
          base44.entities.TimeEntry.filter({ employee_id: emp.id }),
          base44.entities.EmployeeContract.filter({ employee_id: emp.id }),
          base44.entities.Document.filter({ employee_id: emp.id }),
          base44.entities.LeaveRequest.filter({ employee_id: emp.id }),
        ]);
        setTimeEntries(entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        setContracts(ctrs.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)));
        setDocuments(docs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        setLeaves(lvs.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)));
        setNote(emp.internal_notes || "");
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const saveNote = async () => {
    if (!employee) return;
    setSavingNote(true);
    await base44.entities.EmployeeProfile.update(employee.id, { internal_notes: note });
    setSavingNote(false);
  };

  if (loading) return <PageLoader color="blue" />;
  if (!employee) return (
    <div className="p-8 text-center">
      <p className="text-slate-500">Dipendente non trovato</p>
      <Link to={backPath} className="text-blue-600 text-sm mt-2 inline-block">← Torna alla lista</Link>
    </div>
  );

  // Group time entries by day (last 30)
  const recentEntries = timeEntries.slice(0, 60);
  const entriesByDay = recentEntries.reduce((acc, e) => {
    const day = e.timestamp?.split("T")[0];
    if (day) { if (!acc[day]) acc[day] = []; acc[day].push(e); }
    return acc;
  }, {});

  const activeContract = contracts.find(c => c.status === "active");

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={backPath} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center font-bold text-blue-700 text-lg">
              {employee.first_name?.[0]}{employee.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{employee.first_name} {employee.last_name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[employee.status] || STATUS_BADGE.active}`}>
                  {employee.status === "active" ? "Attivo" : employee.status === "inactive" ? "Inattivo" : "Onboarding"}
                </span>
                {employee.job_title && <span className="text-sm text-slate-500">{employee.job_title}</span>}
                {employee.department && <span className="text-sm text-slate-400">· {employee.department}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-slate-200 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* TAB: PROFILO */}
        {tab === "profile" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h2 className="font-semibold text-slate-800">Dati Personali</h2>
              {[
                { icon: User, label: "Nome completo", value: `${employee.first_name} ${employee.last_name}` },
                { icon: Mail, label: "Email", value: employee.email },
                { icon: Phone, label: "Telefono", value: employee.phone },
                { icon: Hash, label: "Codice dipendente", value: employee.employee_code },
              ].map(f => f.value && (
                <div key={f.label} className="flex items-start gap-3">
                  <f.icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">{f.label}</p>
                    <p className="text-sm font-medium text-slate-800">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h2 className="font-semibold text-slate-800">Dati Lavorativi</h2>
              {[
                { icon: Briefcase, label: "Mansione", value: employee.job_title },
                { icon: Building2, label: "Reparto", value: employee.department },
                { icon: MapPin, label: "Sede", value: employee.location },
                { icon: User, label: "Manager", value: employee.manager },
                { icon: Calendar, label: "Data assunzione", value: employee.hire_date ? format(parseISO(employee.hire_date), "d MMMM yyyy", { locale: it }) : null },
              ].map(f => f.value && (
                <div key={f.label} className="flex items-start gap-3">
                  <f.icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">{f.label}</p>
                    <p className="text-sm font-medium text-slate-800">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PRESENZE */}
        {tab === "attendance" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Ultime presenze ({Object.keys(entriesByDay).length} giorni)</h2>
            </div>
            {Object.keys(entriesByDay).length === 0 ? (
              <div className="py-12 text-center text-slate-400">Nessuna timbratura registrata</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {Object.entries(entriesByDay).slice(0, 20).map(([day, entries]) => {
                  const checkIn = entries.find(e => e.type === "check_in");
                  const checkOut = entries.find(e => e.type === "check_out");
                  return (
                    <div key={day} className="px-5 py-3 flex items-center gap-4">
                      <div className="w-24 flex-shrink-0">
                        <p className="text-sm font-medium text-slate-700">{format(parseISO(day), "EEE d MMM", { locale: it })}</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-emerald-700 font-mono">{checkIn ? format(new Date(checkIn.timestamp), "HH:mm") : "—"}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-slate-700 font-mono">{checkOut ? format(new Date(checkOut.timestamp), "HH:mm") : "—"}</span>
                      </div>
                      <div className="flex gap-1 ml-auto flex-wrap">
                        {entries.map((e, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                            {e.type.replace("_", " ")} {format(new Date(e.timestamp), "HH:mm")}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: CONTRATTO */}
        {tab === "contract" && (
          <div className="space-y-4">
            {contracts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-400">Nessun contratto registrato</div>
            ) : contracts.map(c => (
              <div key={c.id} className={`bg-white rounded-xl border p-5 ${c.status === "active" ? "border-emerald-300" : "border-slate-200"}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">{CONTRACT_TYPES[c.contract_type] || c.contract_type}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {c.status === "active" ? "Attivo" : c.status === "expired" ? "Scaduto" : "Terminato"}
                  </span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  {[
                    { label: "Inizio", value: c.start_date ? format(parseISO(c.start_date), "d MMM yyyy", { locale: it }) : "—" },
                    { label: "Fine", value: c.end_date ? format(parseISO(c.end_date), "d MMM yyyy", { locale: it }) : "Indeterminato" },
                    { label: "Ore sett.", value: c.weekly_hours ? `${c.weekly_hours}h` : "—" },
                    { label: "Mansione", value: c.job_title || "—" },
                    { label: "CCNL", value: c.ccnl || "—" },
                    { label: "Livello", value: c.level || "—" },
                  ].map(f => (
                    <div key={f.label} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">{f.label}</p>
                      <p className="font-medium text-slate-800 mt-0.5">{f.value}</p>
                    </div>
                  ))}
                </div>
                {c.document_url && (
                  <a href={c.document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:underline">
                    <FileText className="w-4 h-4" /> Vedi documento
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB: DOCUMENTI */}
        {tab === "documents" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Documenti ({documents.length})</h2>
            </div>
            {documents.length === 0 ? (
              <div className="py-12 text-center text-slate-400">Nessun documento</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {documents.map(doc => (
                  <div key={doc.id} className="px-5 py-3 flex items-center gap-4">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{doc.title}</p>
                      <p className="text-xs text-slate-400">{DOC_TYPE_LABELS[doc.doc_type]} · {doc.created_date ? format(new Date(doc.created_date), "d MMM yyyy", { locale: it }) : "—"}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${doc.status === "approvato" ? "bg-emerald-100 text-emerald-700" : doc.status === "rifiutato" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                      {doc.status === "approvato" ? "Approvato" : doc.status === "rifiutato" ? "Rifiutato" : "In revisione"}
                    </span>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex-shrink-0">Apri</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: FERIE */}
        {tab === "leaves" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Ferie e Permessi ({leaves.length})</h2>
            </div>
            {leaves.length === 0 ? (
              <div className="py-12 text-center text-slate-400">Nessuna richiesta</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Tipo", "Dal", "Al", "Giorni", "Stato", "Note"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leaves.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700 capitalize">{l.leave_type}</td>
                        <td className="px-4 py-3 text-slate-600">{l.start_date}</td>
                        <td className="px-4 py-3 text-slate-600">{l.end_date}</td>
                        <td className="px-4 py-3 text-slate-600">{l.days_count || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${l.status === "approved" ? "bg-emerald-100 text-emerald-700" : l.status === "rejected" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                            {LEAVE_STATUS[l.status] || l.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{l.admin_note || l.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: NOTE */}
        {tab === "notes" && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Note Interne</h2>
            <p className="text-xs text-slate-500">Visibili solo agli admin aziendali. Non visibili al dipendente.</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Es. Ottimo candidato per promozione. Colloquio di valutazione previsto per Q3..."
            />
            <button onClick={saveNote} disabled={savingNote}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {savingNote ? "Salvataggio..." : "Salva note"}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}