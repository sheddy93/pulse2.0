import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { useApiCache } from "@/hooks/useApiCache";
import { Plus, Trash2, Pin, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const PRIORITY_BADGE = {
  low: { label: "Bassa", cls: "bg-slate-100 text-slate-700" },
  normal: { label: "Normale", cls: "bg-blue-100 text-blue-700" },
  high: { label: "Alta", cls: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgente", cls: "bg-red-100 text-red-700" }
};

const ITEMS_PER_PAGE = 15;

export default function AnnouncementBoard() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "normal",
    visibility: "all",
    expires_at: "",
    is_pinned: false
  });

  // Cache company data (2 hour TTL)
  const { data: cachedCompany } = useApiCache(
    'company_metadata',
    async () => base44.entities.Company.filter({ id: '' }),
    2 * 60 * 60 * 1000
  );

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, announces] = await Promise.all([
        cachedCompany || base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.Announcement.filter({ company_id: me.company_id }, { skip: page * ITEMS_PER_PAGE, limit: ITEMS_PER_PAGE }, '-created_date')
      ]);
      setCompany(companies[0]);
      setAnnouncements(announces);
    }).finally(() => setLoading(false));
  }, [page, cachedCompany]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company || !form.title || !form.content) return;

    await base44.entities.Announcement.create({
      company_id: company.id,
      title: form.title,
      content: form.content,
      author_email: user.email,
      priority: form.priority,
      visibility: form.visibility,
      expires_at: form.expires_at || undefined,
      is_pinned: form.is_pinned
    });

    setForm({ title: "", content: "", priority: "normal", visibility: "all", expires_at: "", is_pinned: false });
    setShowForm(false);
    const announces = await base44.entities.Announcement.filter({ company_id: company.id }, '-created_date');
    setAnnouncements(announces);
  };

  const handleDelete = async (id) => {
    if (!confirm("Eliminare l'annuncio?")) return;
    await base44.entities.Announcement.delete(id);
    setAnnouncements(a => a.filter(ann => ann.id !== id));
  };

  const handleTogglePin = async (id, currentPin) => {
    await base44.entities.Announcement.update(id, { is_pinned: !currentPin });
    setAnnouncements(a => a.map(ann => ann.id === id ? { ...ann, is_pinned: !currentPin } : ann));
  };

  const pinned = announcements.filter(a => a.is_pinned);
  const unpinned = announcements.filter(a => !a.is_pinned);

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-slate-800">Bacheca Annunci</h1>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Nuovo annuncio
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Pubblica annuncio</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Titolo *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Es. Riunione aziendale domani"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contenuto *</label>
                <textarea required value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4}
                  placeholder="Descrivi l'annuncio..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Priorità</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(PRIORITY_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Visibilità</label>
                  <select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">Tutti</option>
                    <option value="employees">Solo dipendenti</option>
                    <option value="managers">Solo manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Scadenza</label>
                  <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-xs font-medium text-slate-700">Fissa in alto</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                Pubblica annuncio
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
                Annulla
              </button>
            </div>
          </form>
        )}

        {/* Pinned announcements */}
        {pinned.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-700 text-sm">Annunci Importanti</h2>
            {pinned.map(ann => (
              <div key={ann.id} className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Pin className="w-4 h-4 text-amber-500" />
                      <h3 className="font-semibold text-slate-800">{ann.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_BADGE[ann.priority].cls}`}>
                        {PRIORITY_BADGE[ann.priority].label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{ann.content}</p>
                    <p className="text-xs text-slate-500 mt-2">{format(new Date(ann.created_date), "d MMM yyyy HH:mm", { locale: it })}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleTogglePin(ann.id, ann.is_pinned)} className="p-2 text-amber-500 hover:bg-amber-100 rounded-lg transition-colors">
                      <Pin className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(ann.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Regular announcements */}
        {unpinned.length > 0 && (
          <div className="space-y-3">
            {pinned.length > 0 && <h2 className="font-semibold text-slate-700 text-sm">Annunci Recenti</h2>}
            {unpinned.map(ann => (
              <div key={ann.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{ann.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_BADGE[ann.priority].cls}`}>
                        {PRIORITY_BADGE[ann.priority].label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{ann.content}</p>
                    <p className="text-xs text-slate-400 mt-2">{format(new Date(ann.created_date), "d MMM yyyy HH:mm", { locale: it })}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleTogglePin(ann.id, ann.is_pinned)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                      <Pin className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(ann.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {announcements.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-slate-500">Nessun annuncio pubblicato</p>
          </div>
        )}

        {announcements.length >= ITEMS_PER_PAGE && (
          <div className="flex items-center justify-center gap-2 mt-6 py-4">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              ← Prev
            </button>
            <span className="text-sm text-slate-600">Pagina {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}