import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Send, Upload, X, Loader, Check } from "lucide-react";
import { toast } from "sonner";

const MESSAGE_TYPES = [
  { value: "task", label: "Assegnazione Lavoro" },
  { value: "announcement", label: "Comunicazione" },
  { value: "document", label: "Documento" },
  { value: "notification", label: "Notifica" },
];

const PRIORITY_LEVELS = [
  { value: "low", label: "Bassa" },
  { value: "normal", label: "Normale" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

export default function SendMessage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    message_type: "notification",
    priority: "normal",
    recipient_type: "individual",
    recipient_employees: [],
    recipient_department: "",
    due_date: null,
    attachments: []
  });

  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.company_id) {
        const [emps, depts] = await Promise.all([
          // TODO: Replace with service.EmployeeProfile.filter({ company_id: me.company_id }),
          // TODO: Replace with service.EmployeeProfile.filter({ company_id: me.company_id })
        ]);
        setEmployees(emps);
        
        // Extract unique departments
        const uniqueDepts = [...new Set(emps.map(e => e.department).filter(Boolean))];
        setDepartments(uniqueDepts);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleAddFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPendingFiles([...pendingFiles, ...files.map(f => ({ file: f, uploading: true, url: null }))]);

    for (let file of files) {
      try {
        const result = await base44.integrations.Core.UploadFile({
          file: file
        });

        setPendingFiles(prev => 
          prev.map(f => 
            f.file.name === file.name 
              ? { ...f, uploading: false, url: result.file_url }
              : f
          )
        );
      } catch (err) {
        toast.error(`Errore upload: ${file.name}`);
        setPendingFiles(prev => prev.filter(f => f.file.name !== file.name));
      }
    }
  };

  const handleRemoveFile = (idx) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!formData.subject || !formData.content) {
      toast.error("Oggetto e contenuto sono obbligatori");
      return;
    }

    if (formData.recipient_type === "individual" && formData.recipient_employees.length === 0) {
      toast.error("Seleziona almeno un dipendente");
      return;
    }

    if (formData.recipient_type === "department" && !formData.recipient_department) {
      toast.error("Seleziona un dipartimento");
      return;
    }

    // Check all files uploaded
    const allUploaded = pendingFiles.every(f => !f.uploading && f.url);
    if (pendingFiles.length > 0 && !allUploaded) {
      toast.error("Attendi che tutti i file siano caricati");
      return;
    }

    setSending(true);
    try {
      const attachments = pendingFiles.map(pf => ({
        file_url: pf.url,
        file_name: pf.file.name,
        file_type: pf.file.type,
        file_size: pf.file.size
      }));

      // Determine recipient list
      let recipientIds = [];
      if (formData.recipient_type === "all") {
        recipientIds = employees.map(e => e.id);
      } else if (formData.recipient_type === "department") {
        recipientIds = employees
          .filter(e => e.department === formData.recipient_department)
          .map(e => e.id);
      } else {
        recipientIds = formData.recipient_employees;
      }

      // Create message
      await // TODO: Replace with service.CompanyMessage.create({
        company_id: user.company_id,
        sender_email: user.email,
        sender_name: user.full_name,
        subject: formData.subject,
        content: formData.content,
        message_type: formData.message_type,
        priority: formData.priority,
        recipient_type: formData.recipient_type,
        recipient_employees: recipientIds,
        recipient_department: formData.recipient_department,
        due_date: formData.due_date,
        attachments,
        sent_at: new Date().toISOString()
      });

      // Send notifications
      const recipientEmps = employees.filter(e => recipientIds.includes(e.id));
      for (let emp of recipientEmps) {
        if (emp.email) {
          await base44.integrations.Core.SendEmail({
            to: emp.email,
            subject: `Nuovo messaggio: ${formData.subject}`,
            body: `Hai ricevuto un nuovo messaggio da ${user.full_name}.\n\nOggetto: ${formData.subject}\n\nVisita la dashboard per visualizzare il messaggio completo e gli allegati.`
          });
        }
      }

      toast.success(`Messaggio inviato a ${recipientEmps.length} dipendente${recipientEmps.length > 1 ? "i" : ""}`);
      
      // Reset form
      setFormData({
        subject: "",
        content: "",
        message_type: "notification",
        priority: "normal",
        recipient_type: "individual",
        recipient_employees: [],
        recipient_department: "",
        due_date: null,
        attachments: []
      });
      setPendingFiles([]);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invia Messaggio</h1>
          <p className="text-slate-600">Comunica con i tuoi dipendenti e invia file allegati</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          {/* Tipo messaggio e priorità */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo di Messaggio</label>
              <select
                value={formData.message_type}
                onChange={(e) => setFormData({ ...formData, message_type: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MESSAGE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Priorità</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITY_LEVELS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Oggetto */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Oggetto</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Es. Nuova assegnazione di lavoro"
            />
          </div>

          {/* Contenuto */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Messaggio</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows="4"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Scrivi il messaggio per i dipendenti..."
            />
          </div>

          {/* Destinatari */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Invia a</label>
            <select
              value={formData.recipient_type}
              onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value, recipient_employees: [], recipient_department: "" })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            >
              <option value="individual">Dipendenti selezionati</option>
              <option value="department">Dipartimento</option>
              <option value="all">Tutti i dipendenti</option>
            </select>

            {formData.recipient_type === "individual" && (
              <div className="border border-slate-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {employees.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.recipient_employees.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            recipient_employees: [...formData.recipient_employees, emp.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            recipient_employees: formData.recipient_employees.filter(id => id !== emp.id)
                          });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">{emp.first_name} {emp.last_name}</span>
                  </label>
                ))}
              </div>
            )}

            {formData.recipient_type === "department" && (
              <select
                value={formData.recipient_department}
                onChange={(e) => setFormData({ ...formData, recipient_department: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona dipartimento</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            )}
          </div>

          {/* Data scadenza (per task) */}
          {formData.message_type === "task" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Data Scadenza</label>
              <input
                type="date"
                value={formData.due_date || ""}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* File upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Allegati (PDF, Immagini, ecc.)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                onChange={handleAddFile}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Clicca per caricare file</span>
                <span className="text-xs text-slate-500">PDF, PNG, JPG fino a 50MB</span>
              </label>
            </div>

            {pendingFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {pendingFiles.map((pf, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 flex-1">
                      {pf.uploading ? (
                        <Loader className="w-4 h-4 animate-spin text-blue-600" />
                      ) : (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                      <span className="text-sm text-slate-700 truncate">{pf.file.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottone invia */}
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader className="w-5 h-5 animate-spin" /> Invio in corso...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> Invia Messaggio
              </>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}