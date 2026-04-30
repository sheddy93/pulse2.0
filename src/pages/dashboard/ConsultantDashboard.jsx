import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/layout/StatCard";
import { Building2, Users, Link2, CheckSquare, Copy, Check, Send } from "lucide-react";
import { generatePublicId } from "@/lib/roles";

export default function ConsultantDashboard() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [companyIdInput, setCompanyIdInput] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendDone, setSendDone] = useState(false);
  const [checklist, setChecklist] = useState({ copied: false, linked: false, viewed: false });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const [userLinks, emps] = await Promise.all([
        base44.entities.ConsultantCompanyLink.filter({ consultant_email: me.email }),
        base44.entities.EmployeeProfile.list(),
      ]);
      setLinks(userLinks);
      const approvedLinks = userLinks.filter(l => l.status === "approved");
      const approvedCompanyIds = approvedLinks.map(l => l.company_id);
      setEmployees(emps.filter(e => approvedCompanyIds.includes(e.company_id)));
    }).finally(() => setLoading(false));
  }, []);

  const approved = links.filter(l => l.status === "approved");
  const pending = links.filter(l => l.status === "pending_company" || l.status === "pending_consultant");
  const myId = user?.public_id;

  const handleCopy = () => {
    if (myId) {
      navigator.clipboard.writeText(myId);
      setCopied(true);
      setChecklist(c => ({ ...c, copied: true }));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendRequest = async () => {
    if (!companyIdInput.trim() || !user) return;
    setSendLoading(true);
    try {
      const companies = await base44.entities.Company.filter({ public_id: companyIdInput.trim() });
      if (!companies.length) { alert("Nessuna azienda trovata con questo ID."); return; }
      const company = companies[0];
      await base44.entities.ConsultantCompanyLink.create({
        consultant_email: user.email,
        consultant_public_id: myId,
        company_id: company.id,
        company_public_id: company.public_id,
        company_name: company.name,
        status: "pending_company",
        requested_by: "consultant",
      });
      setCompanyIdInput("");
      setSendDone(true);
      setTimeout(() => setSendDone(false), 3000);
      const updated = await base44.entities.ConsultantCompanyLink.filter({ consultant_email: user.email });
      setLinks(updated);
      setChecklist(c => ({ ...c, linked: true }));
    } finally {
      setSendLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-1">Dashboard Consulente</h1>
          <p className="text-violet-200 text-sm">Gestisci aziende clienti, lavoratori e documenti.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {/* My ID */}
            <div className="flex-1 bg-white/10 rounded-xl p-4">
              <p className="text-xs text-violet-200 mb-1">Il tuo ID pubblico</p>
              <div className="flex items-center gap-2">
                <code className="text-lg font-bold tracking-widest">{myId || "—"}</code>
                <button
                  onClick={handleCopy}
                  className="ml-auto p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-violet-300 mt-1">Condividi con le aziende clienti</p>
            </div>
            {/* Send request */}
            <div className="flex-1 bg-white/10 rounded-xl p-4">
              <p className="text-xs text-violet-200 mb-2">Collega un'azienda tramite ID</p>
              <div className="flex gap-2">
                <input
                  value={companyIdInput}
                  onChange={e => setCompanyIdInput(e.target.value)}
                  placeholder="Es. AZ-5M4KQ2PX"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/20 text-white placeholder:text-violet-300 text-sm border border-white/20 focus:outline-none focus:border-white/50"
                />
                <button
                  onClick={handleSendRequest}
                  disabled={sendLoading || !companyIdInput}
                  className="px-3 py-1.5 bg-white text-violet-700 rounded-lg text-sm font-semibold hover:bg-violet-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {sendDone ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {sendDone ? "Inviata!" : "Invia"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Aziende collegate" value={approved.length} icon={Building2} color="violet" />
          <StatCard label="Dipendenti gestiti" value={employees.length} icon={Users} color="green" />
          <StatCard label="Richieste in attesa" value={pending.length} icon={Link2} color="orange" />
          <StatCard label="Documenti" value="—" icon={CheckSquare} color="slate" />
        </div>

        {/* Checklist + Companies */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Guida introduttiva</h2>
            <ul className="space-y-3">
              {[
                { key: "copied", label: "Copia il tuo ID consulente" },
                { key: "linked", label: "Collega la prima azienda cliente" },
                { key: "viewed", label: "Visualizza i lavoratori" },
              ].map(item => (
                <li key={item.key} className="flex items-center gap-3 text-sm">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${checklist[item.key] ? "bg-emerald-500" : "border-2 border-slate-300"}`}>
                    {checklist[item.key] && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={checklist[item.key] ? "line-through text-slate-400" : "text-slate-700"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Linked companies */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Aziende collegate</h2>
            {approved.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Building2 className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">Nessuna azienda collegata</p>
                <p className="text-sm text-slate-400 mt-1">Inserisci l'ID azienda nel form sopra per inviare una richiesta.</p>
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
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">In attesa</p>
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