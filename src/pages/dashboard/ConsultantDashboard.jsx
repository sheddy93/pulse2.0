import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/layout/StatCard";
import PageLoader from "@/components/layout/PageLoader";
import { Building2, Users, Link2, FileText, Copy, Check, Send } from "lucide-react";

export default function ConsultantDashboard() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [empCount, setEmpCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [idInput, setIdInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");
  const [checklist, setChecklist] = useState({ copied: false, linked: false });

  const loadData = async (me) => {
    const userLinks = await base44.entities.ConsultantCompanyLink.filter({ consultant_email: me.email });
    setLinks(userLinks);
    const approved = userLinks.filter(l => l.status === "approved");
    if (approved.length > 0) {
      const ids = approved.map(l => l.company_id);
      const all = await base44.entities.EmployeeProfile.list();
      setEmpCount(all.filter(e => ids.includes(e.company_id)).length);
    }
  };

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      await loadData(me);
    }).finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (user?.public_id) {
      navigator.clipboard.writeText(user.public_id);
      setCopied(true);
      setChecklist(c => ({ ...c, copied: true }));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = async () => {
    if (!idInput.trim() || !user) return;
    setSending(true);
    setSendMsg("");
    try {
      const companies = await base44.entities.Company.filter({ public_id: idInput.trim() });
      if (!companies.length) { setSendMsg("Nessuna azienda trovata con questo ID."); return; }
      const company = companies[0];
      const existing = links.find(l => l.company_id === company.id && l.status !== "rejected" && l.status !== "removed");
      if (existing) { setSendMsg("Richiesta già esistente per questa azienda."); return; }
      await base44.entities.ConsultantCompanyLink.create({
        consultant_email: user.email,
        consultant_public_id: user.public_id,
        company_id: company.id,
        company_public_id: company.public_id,
        company_name: company.name,
        status: "pending_company",
        requested_by: "consultant",
      });
      setIdInput("");
      setSendMsg("✓ Richiesta inviata!");
      setChecklist(c => ({ ...c, linked: true }));
      await loadData(user);
    } finally {
      setSending(false);
      setTimeout(() => setSendMsg(""), 4000);
    }
  };

  if (loading) return <PageLoader color="violet" />;

  const approved = links.filter(l => l.status === "approved");
  const pending = links.filter(l => l.status === "pending_company" || l.status === "pending_consultant");

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-1">Dashboard Consulente</h1>
          <p className="text-violet-200 text-sm mb-5">Gestisci aziende clienti, lavoratori, documenti e attività operative.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-xs text-violet-200 mb-1">Il tuo ID pubblico</p>
              <div className="flex items-center gap-2">
                <code className="text-base font-bold tracking-wider flex-1">{user?.public_id || "Non assegnato"}</code>
                <button onClick={handleCopy} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-violet-300 mt-1">Condividi con le aziende clienti</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-xs text-violet-200 mb-2">Collega azienda tramite ID</p>
              <div className="flex gap-2">
                <input
                  value={idInput}
                  onChange={e => setIdInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Es. AZ-5M4KQ2PX"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/20 text-white placeholder:text-violet-300 text-sm border border-white/20 focus:outline-none focus:border-white/50"
                />
                <button onClick={handleSend} disabled={sending || !idInput}
                  className="px-3 py-1.5 bg-white text-violet-700 rounded-lg text-sm font-semibold hover:bg-violet-50 disabled:opacity-50 flex items-center gap-1">
                  {sending ? "..." : <><Send className="w-3.5 h-3.5" /> Invia</>}
                </button>
              </div>
              {sendMsg && <p className="text-xs mt-1.5 text-violet-200">{sendMsg}</p>}
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Aziende collegate" value={approved.length} icon={Building2} color="violet" />
          <StatCard label="Dipendenti gestiti" value={empCount} icon={Users} color="green" />
          <StatCard label="Richieste in attesa" value={pending.length} icon={Link2} color="orange" />
          <StatCard label="Documenti" value="—" icon={FileText} color="slate" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Guida introduttiva</h2>
            <ul className="space-y-3">
              {[
                { key: "copied", label: "Copia il tuo ID consulente" },
                { key: "linked", label: "Collega la prima azienda cliente" },
              ].map(item => (
                <li key={item.key} className="flex items-center gap-3 text-sm">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${checklist[item.key] ? "bg-emerald-500" : "border-2 border-slate-300"}`}>
                    {checklist[item.key] && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={checklist[item.key] ? "line-through text-slate-400" : "text-slate-700"}>{item.label}</span>
                </li>
              ))}
              <li className="flex items-center gap-3 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${empCount > 0 ? "bg-emerald-500" : "border-2 border-slate-300"}`}>
                  {empCount > 0 && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={empCount > 0 ? "line-through text-slate-400" : "text-slate-700"}>Visualizza lavoratori azienda</span>
              </li>
            </ul>
          </div>

          {/* Companies */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Aziende collegate</h2>
            {approved.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Building2 className="w-10 h-10 text-slate-300 mb-3" />
                <p className="font-medium text-slate-600">Nessuna azienda collegata</p>
                <p className="text-sm text-slate-400 mt-1">Inserisci l'ID azienda sopra per inviare una richiesta di collegamento.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {approved.map(link => (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">{link.company_name}</p>
                      <p className="text-xs text-slate-400">{link.company_public_id}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Attivo</span>
                  </div>
                ))}
              </div>
            )}
            {pending.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">In attesa</p>
                {pending.map(link => (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg mb-2">
                    <p className="font-medium text-slate-700">{link.company_name || link.company_public_id}</p>
                    <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">In attesa</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}