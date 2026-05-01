import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Upload, Trash2, Eye, FileText, Lock, Users, Plus, Edit2, X } from "lucide-react";
import { toast } from "sonner";

const DOC_TYPES = [
  { value: "contratto", label: "Contratto di Lavoro" },
  { value: "policy", label: "Policy Aziendale" },
  { value: "certificato", label: "Certificato" },
  { value: "corso", label: "Materiale Corso" },
  { value: "altro", label: "Altro" },
];

const CRITICALITY_LEVELS = [
  { value: "critical", label: "Critico (richiede firma)", color: "bg-red-100 text-red-700" },
  { value: "important", label: "Importante", color: "bg-orange-100 text-orange-700" },
  { value: "informational", label: "Informativo", color: "bg-blue-100 text-blue-700" },
];

export default function DocumentArchive() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    doc_type: "contratto",
    description: "",
    criticality: "informational",
    require_signature: false,
    signature_required_roles: [],
    visibility: "company",
    expiry_date: null,
    file: null
  });

  const [permissionsData, setPermissionsData] = useState({
    employees: [],
    visibility: "company"
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.company_id) {
        const [docs, emps] = await Promise.all([
          // TODO: Replace with service.Document.filter({ company_id: me.company_id }),
          // TODO: Replace with service.EmployeeProfile.filter({ company_id: me.company_id })
        ]);
        setDocuments(docs);
        setEmployees(emps);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleUpload = async () => {
    if (!formData.title || !formData.file) {
      toast.error("Titolo e file sono obbligatori");
      return;
    }

    setUploading(true);
    try {
      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({
        file: formData.file
      });

      // Create document record
      // TODO: Replace with service.Document.create({
        company_id: user.company_id,
        title: formData.title,
        doc_type: formData.doc_type,
        description: formData.description,
        file_url: uploadResult.file_url,
        uploaded_by: user.email,
        visibility: formData.visibility,
        expiry_date: formData.expiry_date,
        signature_required: formData.require_signature,
        status: "approvato"
      });

      toast.success("Documento caricato");
      setShowUploadModal(false);
      setFormData({
        title: "",
        doc_type: "contratto",
        description: "",
        criticality: "informational",
        require_signature: false,
        signature_required_roles: [],
        visibility: "company",
        expiry_date: null,
        file: null
      });

      const docs = // TODO: Replace with service.Document.filter({
        company_id: user.company_id
      });
      setDocuments(docs);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo documento?")) return;
    
    try {
      // TODO: Replace with service.Document.delete(docId);
      toast.success("Documento eliminato");
      const docs = // TODO: Replace with service.Document.filter({
        company_id: user.company_id
      });
      setDocuments(docs);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const openPermissionsModal = (doc) => {
    setSelectedDoc(doc);
    setPermissionsData({
      employees: doc.allowed_employees || [],
      visibility: doc.visibility || "company"
    });
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedDoc) return;

    try {
      // TODO: Replace with service.Document.update(selectedDoc.id, {
        allowed_employees: permissionsData.employees,
        visibility: permissionsData.visibility
      });
      toast.success("Permessi aggiornati");
      setShowPermissionsModal(false);
      
      const docs = // TODO: Replace with service.Document.filter({
        company_id: user.company_id
      });
      setDocuments(docs);
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Archivio Documenti</h1>
            <p className="text-slate-600">Gestisci contratti, policy e certificati aziendali</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            <Upload className="w-5 h-5" /> Carica Documento
          </button>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Carica Documento</h2>
                <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Titolo</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Contratto Dipendente"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo</label>
                  <select
                    value={formData.doc_type}
                    onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DOC_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Priorità</label>
                  <select
                    value={formData.criticality}
                    onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CRITICALITY_LEVELS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">File</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Data Scadenza (opzionale)</label>
                <input
                  type="date"
                  value={formData.expiry_date || ""}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.require_signature}
                  onChange={(e) => setFormData({ ...formData, require_signature: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-slate-700">Richiedi firma digitale</span>
              </label>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? "Caricamento..." : "Carica"}
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionsModal && selectedDoc && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Permessi: {selectedDoc.title}</h2>
                <button onClick={() => setShowPermissionsModal(false)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Visibilità</label>
                <select
                  value={permissionsData.visibility}
                  onChange={(e) => setPermissionsData({ ...permissionsData, visibility: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="company">Tutti i dipendenti</option>
                  <option value="selected">Dipendenti selezionati</option>
                </select>
              </div>

              {permissionsData.visibility === "selected" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Seleziona Dipendenti</label>
                  <div className="border border-slate-300 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                    {employees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissionsData.employees.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPermissionsData({
                                ...permissionsData,
                                employees: [...permissionsData.employees, emp.id]
                              });
                            } else {
                              setPermissionsData({
                                ...permissionsData,
                                employees: permissionsData.employees.filter(id => id !== emp.id)
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-700">{emp.first_name} {emp.last_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleSavePermissions}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Salva
                </button>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="bg-slate-50 rounded-lg p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Nessun documento caricato. Inizia caricando il primo documento.</p>
            </div>
          ) : (
            documents.map(doc => {
              const criticalLevel = CRITICALITY_LEVELS.find(c => c.value === doc.criticality);
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                        <p className="text-xs text-slate-500">{DOC_TYPES.find(t => t.value === doc.doc_type)?.label}</p>
                      </div>
                      {criticalLevel && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${criticalLevel.color}`}>
                          {criticalLevel.label.split(" ")[0]}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      {doc.signature_required && (
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Richiede firma
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {doc.visibility === "company" ? "Tutti" : "Selezionati"}
                      </span>
                      {doc.expiry_date && <span>Scade: {doc.expiry_date}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPermissionsModal(doc)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900"
                      title="Gestisci permessi"
                    >
                      <Users className="w-5 h-5" />
                    </button>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900"
                      title="Visualizza"
                    >
                      <Eye className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700"
                      title="Elimina"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}