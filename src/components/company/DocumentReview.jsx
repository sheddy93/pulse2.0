import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Check, X, FileText, Loader2, AlertCircle, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

const STATUS_BADGE = {
  in_revisione: { label: "In revisione", cls: "bg-amber-100 text-amber-700" },
  approvato: { label: "Approvato", cls: "bg-emerald-100 text-emerald-700" },
  rifiutato: { label: "Rifiutato", cls: "bg-red-100 text-red-700" },
};

const DOC_TYPES = {
  contratto: "Contratto",
  busta_paga: "Busta paga",
  certificato: "Certificato",
  corso: "Corso",
  altro: "Altro",
};

export default function DocumentReview({ documents, onDocumentUpdate }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("in_revisione");

  const filtered = useMemo(() => {
    return documents.filter(d => d.status === filter);
  }, [documents, filter]);

  const handleApprove = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    await base44.entities.Document.update(selectedDoc.id, {
      status: "approvato",
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes,
    });
    onDocumentUpdate && onDocumentUpdate();
    setSelectedDoc(null);
    setReviewNotes("");
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    await base44.entities.Document.update(selectedDoc.id, {
      status: "rifiutato",
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes,
    });
    onDocumentUpdate && onDocumentUpdate();
    setSelectedDoc(null);
    setReviewNotes("");
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          ["in_revisione", "In revisione"],
          ["approvato", "Approvati"],
          ["rifiutato", "Rifiutati"],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === val
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label} ({documents.filter(d => d.status === val).length})
          </button>
        ))}
      </div>

      {/* Document list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <FileText className="w-10 h-10 text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">Nessun documento</p>
          </div>
        ) : (
          filtered.map(doc => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <h3 className="font-semibold text-slate-800 truncate">{doc.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${STATUS_BADGE[doc.status].cls}`}>
                      {STATUS_BADGE[doc.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">
                    {DOC_TYPES[doc.doc_type]} • Caricato il {format(parseISO(doc.created_date), "dd MMM yyyy", { locale: it })}
                  </p>
                  {doc.expiry_date && (
                    <p className="text-xs text-slate-400">Scadenza: {format(parseISO(doc.expiry_date), "dd MMM yyyy", { locale: it })}</p>
                  )}
                  {doc.notes && (
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">{doc.notes}</p>
                  )}
                  {doc.review_notes && (
                    <p className="text-xs text-slate-500 mt-2 italic">
                      <strong>Note di revisione:</strong> {doc.review_notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                      title="Visualizza documento"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  {doc.status === "in_revisione" && (
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Revidi
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">Revisione documento</h2>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-slate-700">{selectedDoc.title}</p>
              <p className="text-xs text-slate-500">{DOC_TYPES[selectedDoc.doc_type]}</p>
              {selectedDoc.file_url && (
                <a
                  href={selectedDoc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Visualizza documento
                </a>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Note di revisione (opzionali)</label>
              <textarea
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="Es. Documento verificato, conforme agli standard"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedDoc(null)}
                disabled={loading}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Rifiuta
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Approva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}