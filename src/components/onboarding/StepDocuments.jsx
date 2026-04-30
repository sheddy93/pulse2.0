import { useState } from "react";
import { Upload, Check, FileText, AlertCircle } from "lucide-react";

const REQUIRED_DOCS = [
  { id: "id", label: "Documento di Identità", required: true },
  { id: "tax_code", label: "Codice Fiscale", required: true },
  { id: "insurance", label: "Certificato Assicurativo", required: true },
  { id: "medical", label: "Certificato Medico", required: false }
];

export default function StepDocuments({ employee, onboarding, onComplete }) {
  const [documents, setDocuments] = useState(onboarding?.step_3_documents || []);

  const handleFileUpload = (docType, file) => {
    if (file) {
      const newDocs = documents.filter(d => d.type !== docType);
      newDocs.push({
        type: docType,
        url: `docs/${employee.id}/${docType}_${Date.now()}.pdf`,
        uploaded_at: new Date().toISOString()
      });
      setDocuments(newDocs);
    }
  };

  const allRequiredUploaded = REQUIRED_DOCS
    .filter(d => d.required)
    .every(d => documents.some(doc => doc.type === d.id));

  const handleSubmit = () => {
    if (allRequiredUploaded) {
      onComplete({
        step_3_documents_uploaded: true,
        step_3_documents: documents
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Step 3: Documenti Obbligatori</h2>
        <p className="text-slate-600">Carica i documenti richiesti per completare l'onboarding</p>
      </div>

      {/* Alert */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Documenti Obbligatori</p>
          <p className="text-sm text-blue-800 mt-1">Carica almeno i documenti contrassegnati con * per continuare</p>
        </div>
      </div>

      {/* Documenti */}
      <div className="space-y-4">
        {REQUIRED_DOCS.map(doc => {
          const uploaded = documents.find(d => d.type === doc.id);
          return (
            <div key={doc.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{doc.label}</span>
                    {doc.required && <span className="text-red-600 font-bold">*</span>}
                  </div>
                  {uploaded && (
                    <p className="text-sm text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Caricato il {new Date(uploaded.uploaded_at).toLocaleDateString("it-IT")}
                    </p>
                  )}
                </div>

                {!uploaded ? (
                  <label className="px-4 py-2 border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap">
                    <Upload className="w-4 h-4" /> Carica
                    <input
                      type="file"
                      onChange={e => handleFileUpload(doc.id, e.target.files?.[0])}
                      className="hidden"
                      accept=".pdf,.jpg,.png"
                    />
                  </label>
                ) : (
                  <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg font-semibold">
                    ✓ Caricato
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allRequiredUploaded}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Continua al Prossimo Step →
      </button>
    </div>
  );
}