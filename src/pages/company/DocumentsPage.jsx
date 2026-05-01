import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// Migration: removed base44 dependency
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import LazyImage from "@/components/LazyImage";
import { FileText, Upload, AlertTriangle, CalendarDays, Trash2, ExternalLink, X, Signature } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import { useApiCache } from "@/hooks/useApiCache";

const ITEMS_PER_PAGE = 20;
const DOC_TYPES = { contratto: "Contratto", busta_paga: "Busta paga", certificato: "Certificato", corso: "Corso", altro: "Altro" };
const VISIBILITY = { employee: "Solo dipendente", company: "Solo azienda", consultant: "Solo consulente", all: "Tutti" };
const STATUS_BADGE = {
  in_revisione: { label: "In revisione", cls: "bg-amber-100 text-amber-700" },
  approvato: { label: "Approvato", cls: "bg-emerald-100 text-emerald-700" },
  rifiutato: { label: "Rifiutato", cls: "bg-red-100 text-red-700" },
};

function ExpiryBadge({ date }) {
  if (!date) return null;
  const days = differenceInDays(new Date(date), new Date());
  if (days < 0) return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Scaduto</span>;
  if (days <= 30) return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">Scade in {days}gg</span>;
  if (days <= 90) return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Scade in {days}gg</span>;
  return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">{format(new Date(date), "d MMM yyyy", { locale: it })}</span>;
}

export default function DocumentsPage() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({ title: "", doc_type: "contratto", employee_id: "", visibility: "all", expiry_date: "", notes: "", file: null, signature_required: false });

  const loadDocs = async (companyId) => {
    const d = // TODO: Replace with service.Document.filter({ company_id: companyId }, { skip: page * ITEMS_PER_PAGE, limit: ITEMS_PER_PAGE });
    setDocs([...d].sort((a, b) => {
      if (a.expiry_date && b.expiry_date) return new Date(a.expiry_date) - new Date(b.expiry_date);
      if (a.expiry_date) return -1;
      if (b.expiry_date) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    }));
  };

  // Cache employees (30 min TTL)
  const { data: cachedEmployees } = useApiCache(
    'employees',
    async () => // TODO: Replace with service.EmployeeProfile.filter({ company_id: '' }),
    30 * 60 * 1000
  );

  useEffect(() => {
    // TODO: Replace with authService.me() and service calls
    setLoading(false);
  }, [page, cachedEmployees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company || !form.file) return;
    setUploading(true);
    // TODO: Replace with service calls for UploadFile and Document.create
    const file_url = null;
    setForm({ title: "", doc_type: "contratto", employee_id: "", visibility: "all", expiry_date: "", notes: "", file: null, signature_required: false });
    setShowForm(false);
    await loadDocs(company.id);
    setUploading(false);
  };

  const handleDelete = async (doc) => {
    if (!confirm("Eliminare il documento?")) return;
    // TODO: Replace with service.Document.delete(doc.id);
    await loadDocs(company.id);
  };

  const filtered = filterType === "all" ? docs : docs.filter(d => d.doc_type === filterType);
  const expiringSoon = docs.filter(d => d.expiry_date && differenceInDays(new Date(d.expiry_date), new Date()) <= 30 && differenceInDays(new Date(d.expiry_date), new Date()) >= 0);

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Documenti</h1>
            <p className="text-sm text-slate-500">{docs.length} documenti · {expiringSoon.length} in scadenza entro 30 giorni</p>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard/company/documents/expiring" className="flex items-center gap-2 px-4 py-2 border border-orange-300 bg-orange-50 text-orange-700 rounded-lg text-sm font-semibold hover:bg-orange-100">
              <CalendarDays className="w-4 h-4" /> Scadenzario
              {expiringSoon.length > 0 && <span className="bg-orange-500 text-white rounded-full px-1.5 text-xs">{expiringSoon.length}</span>}
            </Link>
            <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              {showForm ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {showForm ? "Annulla" : "Carica documento"}
            </button>
          </div>
        </div>

        {/* Alert scadenze */}
        {expiringSoon.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-800">
              <strong>{expiringSoon.length} documenti</strong> scadono entro 30 giorni.
              <Link to="/dashboard/company/documents/expiring" className="ml-2 underline font-semibold">Vai allo scadenzario →</Link>
            </p>
          </div>
        )}

        {/* Form upload */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Carica nuovo documento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Titolo *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Es. Contratto Mario Rossi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo documento</label>
                <select value={form.doc_type} onChange={e => setForm(f => ({ ...f, doc_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dipendente (opzionale)</label>
                <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Nessuno (aziendale) —</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data scadenza</label>
                <input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Visibilità</label>
                <select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(VISIBILITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">File *</label>
                <input type="file" required onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input type="checkbox" id="sig_req" checked={form.signature_required} onChange={e => setForm(f => ({ ...f, signature_required: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                <label htmlFor="sig_req" className="text-sm font-medium text-slate-700 cursor-pointer">Richiedi firma del dipendente</label>
              </div>
            </div>
            <button type="submit" disabled={uploading} className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {uploading ? "Caricamento in corso..." : "Carica documento"}
            </button>
          </form>
        )}

        {/* Filtri */}
        <div className="flex gap-2 flex-wrap">
          {[["all", "Tutti"], ...Object.entries(DOC_TYPES)].map(([k, v]) => (
            <button key={k} onClick={() => setFilterType(k)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === k ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {v}
            </button>
          ))}
        </div>

        {/* Lista documenti */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-14 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nessun documento</p>
              <p className="text-sm text-slate-400 mt-1">Carica il primo documento con il pulsante in alto</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Titolo", "Tipo", "Dipendente", "Stato", "Firma", "Scadenza", "Visibilità", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(doc => {
                    const emp = employees.find(e => e.id === doc.employee_id);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800 max-w-[200px] truncate">{doc.title}</td>
                        <td className="px-5 py-3 text-slate-500">{DOC_TYPES[doc.doc_type] || doc.doc_type}</td>
                        <td className="px-5 py-3 text-slate-500">{emp ? `${emp.first_name} ${emp.last_name}` : <span className="text-slate-300">—</span>}</td>
                        <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[doc.status]?.cls || STATUS_BADGE.in_revisione.cls}`}>{STATUS_BADGE[doc.status]?.label || "In revisione"}</span></td>
                        <td className="px-5 py-3">
                          {doc.signature_required ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                              doc.signature_status === 'signed' ? 'bg-emerald-100 text-emerald-700' :
                              doc.signature_status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              <Signature className="w-3 h-3" />
                              {doc.signature_status === 'signed' ? 'Firmato' : doc.signature_status === 'rejected' ? 'Rifiutato' : 'In attesa'}
                            </span>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-5 py-3"><ExpiryBadge date={doc.expiry_date} /></td>
                        <td className="px-5 py-3 text-slate-400 text-xs">{VISIBILITY[doc.visibility]}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            {doc.file_url && (
                              <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button onClick={() => handleDelete(doc)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length >= ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-2 mt-6 py-4">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-600">Pagina {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}