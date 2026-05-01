import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Briefcase, Send, Check, X, Settings, Clock } from "lucide-react";
import PermissionsEditor from "@/components/admin/PermissionsEditor";
import PermissionRequestsPanel from "@/components/admin/PermissionRequestsPanel";

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
  const [idInput, setIdInput] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [editingPermissions, setEditingPermissions] = useState(null);
  const [showRequests, setShowRequests] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const loadLinks = async (comp) => {
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
        if (comp) {
          await loadLinks(comp);
          const pending = await base44.entities.PermissionChangeRequest.filter({ company_id: comp.id, status: "pending" });
          setPendingCount(pending.length);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleInvite = async () => {
    if (!idInput.trim() || !company) return;
    setSending(true); setMsg("");
    try {
      const users = await base44.entities.User.filter({ public_id: idInput.trim(), role: "consultant" });
      if (!users.length) { setMsg("Nessun consulente trovato con questo ID."); return; }
      const consultant = users[0];
      const existing = links.find(l => l.consultant_email === consultant.email && l.status !== "rejected" && l.status !== "removed");
      if (existing) { setMsg("Richiesta già esistente per questo consulente."); return; }
      await base44.entities.ConsultantCompanyLink.create({
        consultant_email: consultant.email,
        consultant_public_id: consultant.public_id,
        company_id: company.id,
        company_public_id: company.public_id,
        company_name: company.name,
        status: "pending_consultant",
        requested_by: "company",
      });
      setIdInput(""); setMsg("✓ Richiesta inviata!");
      await loadLinks(company);
    } finally {
      setSending(false);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const handleDecision = async (link, status) => {
    await base44.entities.ConsultantCompanyLink.update(link.id, {
      status,
      approved_at: status === "approved" ? new Date().toISOString() : undefined,
      rejected_at: status === "rejected" ? new Date().toISOString() : undefined,
    });
    await loadLinks(company);
  };

  if (loading) return <PageLoader />;

  const pendingForCompany = links.filter(l => l.status === "pending_company");

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Consulenti</h1>
            <p className="text-sm text-slate-500">Gestisci i consulenti autorizzati ad accedere ai dati aziendali</p>
          </div>
          {pendingCount > 0 && (
            <button
              onClick={() => setShowRequests(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-semibold hover:bg-amber-100"
            >
              <Clock className="w-4 h-4" />
              {pendingCount} richiesta{pendingCount !== 1 ? "e" : ""} permessi
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Invita consulente tramite ID pubblico</h2>
          <div className="flex gap-3">
            <input value={idInput} onChange={e => setIdInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleInvite()}
              placeholder="Es. CONS-8KD92FJX"
              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleInvite} disabled={sending || !idInput}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              <Send className="w-4 h-4" /> {sending ? "Invio..." : "Invia"}
            </button>
          </div>
          {msg && <p className="text-sm mt-2 text-slate-600">{msg}</p>}
        </div>

        {pendingForCompany.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-800 mb-3">Richieste in attesa ({pendingForCompany.length})</h2>
            <div className="space-y-3">
              {pendingForCompany.map(link => (
                <div key={link.id} className="flex items-center justify-between gap-4 bg-white rounded-lg p-3 border border-orange-100">
                  <div>
                    <p className="font-medium text-slate-800">{link.consultant_email}</p>
                    <p className="text-xs text-slate-400">ID: {link.consultant_public_id || "—"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDecision(link, "approved")} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">
                      <Check className="w-3.5 h-3.5" /> Approva
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
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                      {link.status === "approved" && (
                        <button
                          onClick={() => setEditingPermissions({ email: link.consultant_email, full_name: link.consultant_email, isConsultant: true })}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          Permessi
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editingPermissions && (
        <PermissionsEditor
          targetUser={editingPermissions}
          companyId={company?.id}
          grantedBy={user?.email}
          isConsultant={editingPermissions.isConsultant}
          onClose={() => setEditingPermissions(null)}
        />
      )}

      {showRequests && (
        <PermissionRequestsPanel
          companyId={company?.id}
          onClose={() => { setShowRequests(false); base44.entities.PermissionChangeRequest.filter({ company_id: company?.id, status: "pending" }).then(r => setPendingCount(r.length)); }}
        />
      )}
    </AppShell>
  );
}