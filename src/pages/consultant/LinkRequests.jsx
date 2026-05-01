import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Link2, Check, X } from "lucide-react";

export default function LinkRequests() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLinks = async (email) => {
    // TODO: Replace with service.ConsultantCompanyLink.filter({ consultant_email: email })
    setLinks([]);
  };

  useEffect(() => {
    // TODO: Replace with service calls for REST API
    const loadData = async () => {
      // const me = await authService.me();
      setUser(me);
      await loadLinks(me.email);
    }).finally(() => setLoading(false));
  }, []);

  const handleDecision = async (link, status) => {
    // TODO: Replace with service.ConsultantCompanyLink.update()
    await loadLinks(user.email);
  };

  if (loading) return <PageLoader color="violet" />;

  const pendingForMe = links.filter(l => l.status === "pending_consultant");
  const others = links.filter(l => l.status !== "pending_consultant");
  const statusMap = {
    approved: { l: "Approvato", c: "bg-emerald-100 text-emerald-700" },
    rejected: { l: "Rifiutato", c: "bg-red-100 text-red-600" },
    pending_company: { l: "In attesa azienda", c: "bg-blue-100 text-blue-700" },
    removed: { l: "Rimosso", c: "bg-slate-100 text-slate-500" },
  };

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Richieste di collegamento</h1>
          <p className="text-sm text-slate-500">Accetta o rifiuta le richieste di accesso da parte delle aziende</p>
        </div>

        {pendingForMe.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-orange-500" /> In attesa della tua approvazione ({pendingForMe.length})
            </h2>
            <div className="space-y-3">
              {pendingForMe.map(link => (
                <div key={link.id} className="flex items-center justify-between gap-4 bg-white rounded-lg p-4 border border-orange-100">
                  <div>
                    <p className="font-semibold text-slate-800">{link.company_name || "Azienda"}</p>
                    <p className="text-xs text-slate-400">ID: {link.company_public_id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDecision(link, "approved")} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">
                      <Check className="w-3.5 h-3.5" /> Accetta
                    </button>
                    <button onClick={() => handleDecision(link, "rejected")} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50">
                      <X className="w-3.5 h-3.5" /> Rifiuta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Storico richieste</h2>
          </div>
          {others.length === 0 && pendingForMe.length === 0 ? (
            <div className="py-12 text-center">
              <Link2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nessuna richiesta ancora</p>
            </div>
          ) : others.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">Nessuna richiesta nello storico</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {others.map(link => {
                const s = statusMap[link.status] || { l: link.status, c: "bg-slate-100 text-slate-500" };
                return (
                  <div key={link.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-800">{link.company_name || "Azienda"}</p>
                      <p className="text-xs text-slate-400">ID: {link.company_public_id}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.c}`}>{s.l}</span>
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