import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import { Briefcase, Link2, Check, X, Send } from "lucide-react";

const STATUS_MAP = {
  approved: { label: "Collegato", cls: "bg-emerald-100 text-emerald-700" },
  pending_company: { label: "Da approvare", cls: "bg-orange-100 text-orange-700" },
  pending_consultant: { label: "In attesa consulente", cls: "bg-blue-100 text-blue-700" },
  rejected: { label: "Rifiutato", cls: "bg-red-100 text-red-600" },
  removed: { label: "Rimosso", cls: "bg-slate-100 text-slate-500" },
};

export default function CompanyConsultants() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consultantId, setConsultantId] = useState("");
  const [sending, setSending] = useState(false);

  const load = async (me, comp) => {
    const l = await base44.entities.ConsultantCompanyLink.filter({ company_id: comp.id });
    setLinks(l);
  };

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.company_id) {
        const companies = await base44.entities.Company.filter({ id: me.company_id });
        const comp = companies[0];
        setCompany(comp || null);
        if (comp) await load(me, comp);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleInvite = async () => {
    if (!consultantId.trim() || !company) return;
    setSending(true);
    try {
      // Look up consultant by public_id in User
      const users = await base44.entities.User.filter({ public_id: consultantId.trim() });
      if (!users.length) { alert("Nessun consulente trovato con questo ID."); return; }
      const consultant = users[0];
      await base44.entities.ConsultantCompanyLink.create({
        consultant_email: consultant.email,
        consultant_public_id: consultant.public_id,
        company_id: company.id,
        company_public_id: company.public_id,
        company_name: company.name,
        status: "pending_consultant",
        requested_by: "company",
      });
      setConsultantId("");
      await load(null, company);
    } finally {
      setSending(false);
    }
  };

  const handleDecision = async (link, decision) => {
    await base44.entities.ConsultantCompanyLink.update(link.id, {
      status: decision,
      approved_at: decision === "approved" ? new Date().toISOString() : undefined,
      rejected_at: decision === "rejected" ? new Date().toISOString() : undefined,
    });
    await load(null, company);
  };

  if (loading) return (
    <AppShell user={user}><div className="flex h-64 items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div></AppShell>
  );

  const pendingForCompany = links.filter(l => l.status === "pending_company");

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Consulenti collegati</h1>
          <p className="text-sm text-slate-500">Gestisci i consulenti autorizzati ad accedere ai dati aziendali</p>
        </div>

        {/* Invite */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Invita consulente tramite ID</h2>
          <div className="flex gap-3">
            <input
              value={consultantId}
              onChange={e => setConsultantId(e.target.value)}
              placeholder="Es. CONS-8KD92FJX"
              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleInvite}
              disabled={sending || !consultantId}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? "Invio..." : "Invia richiesta"}
            </button>
          </div>
        </div>

        {/* Pending approvals */}
        {pendingForCompany.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-orange-500" />
              Richieste in attesa ({pendingForCompany.length})
            </h2>
            <div className="space-y-3">
              {pendingForCompany.map(link => (
                <div key={link.id} className="flex items-center justify-between gap-4 bg-white rounded-lg p-3 border border-orange-100">
                  <div>
                    <p className="font-medium text-slate-800">{link.consultant_email}</p>
                    <p className="text-xs text-slate-400">ID: {link.consultant_public_id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDecision(link, "approved")} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">
                      <Check className="w-3.5 h-3.5" /> Approva
                    </button>
                    <button onClick={() => handleDecision(link, "rejected")} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100">
                      <X className="w-3.5 h-3.5" /> Rifiuta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All links */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Tutti i consulenti ({links.length})</h2>
          </div>
          {links.length === 0 ? (
            <div className="py-12 text-center">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nessun consulente collegato</p>
              <p className="text-sm text-slate-400 mt-1">Invita un consulente con il suo ID pubblico</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {links.map(link => {
                const badge = STATUS_MAP[link.status] || STATUS_MAP.approved;
                return (
                  <div key={link.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-800">{link.consultant_email}</p>
                      <p className="text-xs text-slate-400">ID: {link.consultant_public_id || "—"}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
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