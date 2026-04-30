import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { FileText, Check, X, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const DOC_TYPES = { contratto: "Contratto", busta_paga: "Busta paga", certificato: "Certificato", corso: "Corso", altro: "Altro" };
const SIGNATURE_BADGE = {
  pending: { label: "In attesa di firma", cls: "bg-amber-100 text-amber-700", icon: Clock },
  signed: { label: "Firmato", cls: "bg-emerald-100 text-emerald-700", icon: Check },
  rejected: { label: "Rifiutato", cls: "bg-red-100 text-red-700", icon: X },
};

export default function DocumentSignaturePage() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingDocId, setSigningDocId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [signature, setSignature] = useState("");
  const [reason, setReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      if (emps[0]) {
        setEmployee(emps[0]);
        const docs = await base44.entities.Document.filter({ employee_id: emps[0].id, signature_required: true });
        setDocs(docs.sort((a, b) => {
          // Pending first, then signed, then rejected
          const order = { pending: 0, signed: 1, rejected: 2 };
          return (order[a.signature_status] || 3) - (order[b.signature_status] || 3);
        }));
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSignDocument = async () => {
    if (!signature.trim()) return;
    const doc = docs.find(d => d.id === signingDocId);
    if (!doc) return;

    await base44.entities.Document.update(doc.id, {
      signature_status: "signed",
      signed_by: user.email,
      signed_at: new Date().toISOString(),
      signature_notes: signature,
    });

    setDocs(prev => prev.map(d => 
      d.id === signingDocId 
        ? { ...d, signature_status: "signed", signed_by: user.email, signed_at: new Date().toISOString(), signature_notes: signature }
        : d
    ));
    setShowModal(false);
    setSignature("");
    setSigningDocId(null);
  };

  const handleRejectDocument = async () => {
    if (!reason.trim()) return;
    const doc = docs.find(d => d.id === signingDocId);
    if (!doc) return;

    await base44.entities.Document.update(doc.id, {
      signature_status: "rejected",
      signed_by: user.email,
      signed_at: new Date().toISOString(),
      signature_notes: reason,
    });

    setDocs(prev => prev.map(d => 
      d.id === signingDocId 
        ? { ...d, signature_status: "rejected", signed_by: user.email, signed_at: new Date().toISOString(), signature_notes: reason }
        : d
    ));
    setShowModal(false);
    setReason("");
    setSigningDocId(null);
    setIsRejecting(false);
  };

  if (loading) return <PageLoader color="green" />;

  const pendingCount = docs.filter(d => d.signature_status === "pending").length;
  const signedCount = docs.filter(d => d.signature_status === "signed").length;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Documenti da firmare</h1>
          <p className="text-sm text-slate-500">{pendingCount} in attesa · {signedCount} firmati</p>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Hai <strong>{pendingCount} documento{pendingCount > 1 ? "i" : ""}</strong> in attesa di firma.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {docs.map(doc => {
            const badge = SIGNATURE_BADGE[doc.signature_status];
            const BadgeIcon = badge.icon;
            return (
              <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <FileText className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{doc.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{DOC_TYPES[doc.doc_type]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <BadgeIcon className="w-3.5 h-3.5" />
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                    {doc.signed_at && (
                      <span className="text-xs text-slate-500">
                        {format(new Date(doc.signed_at), "d MMM yyyy", { locale: it })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {doc.signature_status === "pending" && (
                    <button
                      onClick={() => {
                        setSigningDocId(doc.id);
                        setShowModal(true);
                        setIsRejecting(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                    >
                      Firma
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {docs.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">Nessun documento da firmare</p>
          </div>
        )}
      </div>

      {/* Modal firma */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">
              {isRejecting ? "Rifiuta documento" : "Firma documento"}
            </h2>
            
            {isRejecting ? (
              <>
                <p className="text-sm text-slate-600">Specifica il motivo del rifiuto:</p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Es. Il documento contiene errori..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setReason("");
                      setSigningDocId(null);
                      setIsRejecting(false);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleRejectDocument}
                    disabled={!reason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                  >
                    Rifiuta
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">Digita il tuo nome completo come firma:</p>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Es. Mario Rossi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsRejecting(true)}
                    className="flex-1 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50"
                  >
                    Rifiuta
                  </button>
                  <button
                    onClick={handleSignDocument}
                    disabled={!signature.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Firma
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}