import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { FileText, Lock, Check, X, Eye, Download, Loader } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const DOC_TYPES = {
  contratto: "Contratto",
  policy: "Policy",
  certificato: "Certificato",
  corso: "Corso",
  altro: "Altro"
};

export default function DocumentManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [signing, setSigning] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showSignModal, setShowSignModal] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);

      // Get employee profile
      const emps = await base44.entities.EmployeeProfile.filter({
        user_email: me.email
      });

      if (emps[0]) {
        setEmployeeProfile(emps[0]);

        // Get documents accessible to this employee
        const allDocs = await base44.entities.Document.filter({
          company_id: emps[0].company_id
        });

        // Filter by visibility
        const accessibleDocs = allDocs.filter(doc => {
          if (doc.visibility === "company") return true;
          if (doc.visibility === "employee" && doc.employee_id === emps[0].id) return true;
          if (doc.allowed_employees?.includes(emps[0].id)) return true;
          return false;
        });

        setDocuments(accessibleDocs);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSignDocument = async () => {
    if (!selectedDoc || !employeeProfile) return;

    setSigning(selectedDoc.id);
    try {
      const result = await base44.functions.invoke('signDocument', {
        document_id: selectedDoc.id,
        employee_id: employeeProfile.id,
        employee_email: user.email,
        employee_name: user.full_name
      });

      toast.success("Documento firmato con successo");
      setShowSignModal(false);

      // Refresh documents
      const emps = await base44.entities.EmployeeProfile.filter({
        user_email: user.email
      });

      if (emps[0]) {
        const allDocs = await base44.entities.Document.filter({
          company_id: emps[0].company_id
        });

        const accessibleDocs = allDocs.filter(doc => {
          if (doc.visibility === "company") return true;
          if (doc.visibility === "employee" && doc.employee_id === emps[0].id) return true;
          if (doc.allowed_employees?.includes(emps[0].id)) return true;
          return false;
        });

        setDocuments(accessibleDocs);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSigning(null);
    }
  };

  const getSignatureStatus = (doc) => {
    if (!doc.signature_required) return null;

    const userSigned = doc.signed_by?.includes(user.email);
    return userSigned ? "signed" : "pending";
  };

  if (loading) return <PageLoader />;

  const signedDocs = documents.filter(d => getSignatureStatus(d) === "signed");
  const pendingSignatureDocs = documents.filter(d => d.signature_required && getSignatureStatus(d) === "pending");
  const otherDocs = documents.filter(d => !d.signature_required || getSignatureStatus(d) !== "pending");

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Miei Documenti</h1>
          <p className="text-slate-600">Visualizza, scarica e firma i tuoi documenti aziendali</p>
        </div>

        {/* Signature Modal */}
        {showSignModal && selectedDoc && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Conferma Firma</h2>
              <p className="text-slate-600">
                Stai per firmare digitalmente il documento <strong>{selectedDoc.title}</strong>. Questa azione è irreversibile.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Firma digitale di {user.full_name} ({user.email}) in data {format(new Date(), "d MMMM yyyy", { locale: it })}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSignDocument}
                  disabled={signing === selectedDoc.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {signing === selectedDoc.id ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" /> Firma in corso...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Firma
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowSignModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Signatures */}
        {pendingSignatureDocs.length > 0 && (
          <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
            <p className="font-semibold text-orange-900 mb-3">
              ⚠️ {pendingSignatureDocs.length} documento{pendingSignatureDocs.length > 1 ? "i" : ""} richiede{pendingSignatureDocs.length > 1 ? "" : "no"} firma
            </p>
            <div className="space-y-2">
              {pendingSignatureDocs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoc(doc);
                    setShowSignModal(true);
                  }}
                  className="w-full text-left px-4 py-2 bg-white rounded border border-orange-200 hover:bg-orange-50 transition-colors"
                >
                  <p className="font-medium text-slate-900">{doc.title}</p>
                  <p className="text-xs text-slate-500">Azione richiesta: Firma digitale</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Signed Documents */}
        {signedDocs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-600" /> Documenti Firmati
            </h2>
            <div className="space-y-2">
              {signedDocs.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{doc.title}</p>
                    <p className="text-xs text-slate-500">{DOC_TYPES[doc.doc_type]}</p>
                    {doc.signed_at && (
                      <p className="text-xs text-emerald-600 mt-1">Firmato il {format(new Date(doc.signed_at), "d MMMM yyyy", { locale: it })}</p>
                    )}
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-slate-100 rounded text-slate-600"
                  >
                    <Eye className="w-5 h-5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Documents */}
        {otherDocs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Tutti i Documenti</h2>
            <div className="space-y-2">
              {otherDocs.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{doc.title}</p>
                      {doc.expiry_date && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                          Scade: {doc.expiry_date}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{DOC_TYPES[doc.doc_type]}</p>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-slate-100 rounded text-slate-600"
                  >
                    <Eye className="w-5 h-5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {documents.length === 0 && (
          <div className="bg-slate-50 rounded-lg p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Nessun documento disponibile al momento.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}