import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import DocumentReview from "@/components/company/DocumentReview";
import { FileText, AlertCircle } from "lucide-react";

export default function DocumentReviewPage() {
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      // Get all companies linked to this consultant
      const links = await base44.entities.ConsultantCompanyLink.filter({
        consultant_email: me.email,
        status: "approved",
      });

      if (links.length > 0) {
        const companyIds = links.map(l => l.company_id);
        const allDocs = await base44.entities.Document.list();
        // Filter docs from linked companies
        const consultantDocs = allDocs.filter(d => companyIds.includes(d.company_id));
        setDocuments(consultantDocs);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleDocumentUpdate = async () => {
    const user = await base44.auth.me();
    const links = await base44.entities.ConsultantCompanyLink.filter({
      consultant_email: user.email,
      status: "approved",
    });

    if (links.length > 0) {
      const companyIds = links.map(l => l.company_id);
      const allDocs = await base44.entities.Document.list();
      const consultantDocs = allDocs.filter(d => companyIds.includes(d.company_id));
      setDocuments(consultantDocs);
    }
  };

  if (loading) return <PageLoader color="violet" />;

  const pendingCount = documents.filter(d => d.status === "in_revisione").length;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-1">Revisione Documenti</h1>
          <p className="text-violet-200 text-sm">Approva o rifiuta i documenti caricati dalle aziende clienti.</p>
          {pendingCount > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 w-fit">
              <AlertCircle className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-semibold">{pendingCount} documento{pendingCount !== 1 ? "i" : ""} in attesa di revisione</span>
            </div>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">Nessun documento disponibile</p>
            <p className="text-sm text-slate-500 mt-1">I documenti caricati dalle aziende appariranno qui.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <DocumentReview documents={documents} onDocumentUpdate={handleDocumentUpdate} />
          </div>
        )}
      </div>
    </AppShell>
  );
}