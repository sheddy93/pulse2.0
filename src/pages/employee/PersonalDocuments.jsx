import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Plus, File, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

const DOC_TYPES = {
  identity: "Documento d'Identità",
  certificate: "Certificato",
  attestation: "Attestato",
  license: "Patente/Licenza",
  passport: "Passaporto",
  driving_license: "Patente di Guida",
  health_insurance: "Tessera Sanitaria",
  vaccination: "Certificato Vaccinazione",
  other: "Altro"
};

export default function PersonalDocuments() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    document_name: "",
    document_type: "other",
    issue_date: "",
    expiry_date: "",
    description: "",
    is_public: false
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      const emp = emps[0];
      setEmployee(emp);

      if (emp) {
        const docs = await base44.entities.EmployeePersonalDocument.filter({ employee_id: emp.id });
        setDocuments(docs.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)));
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee) return;

    // Mock file upload - in produzione faresti vero upload
    const mockFileUrl = `data:text/plain,Documento ${form.document_name}`;

    await base44.entities.EmployeePersonalDocument.create({
      company_id: employee.company_id,
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      file_url: mockFileUrl,
      uploaded_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      ...form
    });

    const updated = await base44.entities.EmployeePersonalDocument.filter({ employee_id: employee.id });
    setDocuments(updated.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)));
    setShowForm(false);
    setForm({ document_name: "", document_type: "other", issue_date: "", expiry_date: "", description: "", is_public: false });
  };

  const handleDelete = async (id) => {
    if (confirm("Elimina questo documento?")) {
      await base44.entities.EmployeePersonalDocument.delete(id);
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  const getDocumentStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = parseISO(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return { status: "expired", label: "Scaduto", color: "bg-red-100 text-red-700" };
    if (daysUntilExpiry <= 30) return { status: "expiring", label: `Scade tra ${daysUntilExpiry} giorni`, color: "bg-orange-100 text-orange-700" };
    return { status: "valid", label: `Valido fino al ${format(expiry, 'd MMM yyyy', { locale: it })}`, color: "bg-emerald-100 text-emerald-700" };
  };

  const expiringDocs = documents.filter(d => {
    const status = getDocumentStatus(d.expiry_date);
    return status && ["expired", "expiring"].includes(status.status);
  });

  if (loading) return <PageLoader color="green" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">I Miei Documenti</h1>
            <p className="text-sm text-slate-500">Gestisci i tuoi documenti personali</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" /> Carica Documento
          </button>
        </div>

        {/* Alert Scadenze */}
        {expiringDocs.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-800">Documenti in Scadenza</p>
              <p className="text-sm text-orange-700 mt-1">{expiringDocs.length} documento/i richiede attenzione</p>
            </div>
          </div>
        )}

        {/* Form Caricamento */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Carica Nuovo Documento</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Documento *</label>
                <input 
                  type="text" 
                  required 
                  value={form.document_name} 
                  onChange={e => setForm(f => ({ ...f, document_name: e.target.value }))} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Es. Certificato Primo Soccorso"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Documento *</label>
                <select 
                  value={form.document_type} 
                  onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data Emissione</label>
                <input 
                  type="date" 
                  value={form.issue_date} 
                  onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data Scadenza</label>
                <input 
                  type="date" 
                  value={form.expiry_date} 
                  onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                  rows={2} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" 
                  placeholder="Note aggiuntive..."
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="is_public" 
                  checked={form.is_public} 
                  onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} 
                  className="w-4 h-4"
                />
                <label htmlFor="is_public" className="text-sm font-semibold text-slate-600">Condividi con manager/HR</label>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
              >
                Annulla
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
              >
                Carica
              </button>
            </div>
          </form>
        )}

        {/* Lista Documenti */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">I Tuoi Documenti ({documents.length})</h2>
          </div>

          {documents.length === 0 ? (
            <div className="py-12 text-center">
              <File className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Nessun documento caricato</p>
              <p className="text-sm text-slate-500 mt-1">Inizia caricando il tuo primo documento</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map(doc => {
                const status = getDocumentStatus(doc.expiry_date);
                return (
                  <div key={doc.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800">{doc.document_name}</h3>
                          {doc.is_public && <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-blue-100 text-blue-700">Condiviso</span>}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                          <span>{DOC_TYPES[doc.document_type]}</span>
                          {doc.issue_date && <span>• Emesso {format(parseISO(doc.issue_date), 'd MMM yyyy', { locale: it })}</span>}
                        </div>

                        {status && (
                          <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                        )}

                        {doc.description && (
                          <p className="text-sm text-slate-600 mt-2">{doc.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a 
                          href={doc.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Scarica documento"
                        >
                          <File className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleDelete(doc.id)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Elimina documento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}