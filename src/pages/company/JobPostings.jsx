import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Plus, Edit2, Trash2, Eye, Lock } from "lucide-react";
import { format } from "date-fns";

const JOB_LEVELS = { junior: "Junior", mid: "Mid", senior: "Senior", lead: "Lead", manager: "Manager" };
const EMPLOYMENT_TYPES = { full_time: "Tempo Pieno", part_time: "Part Time", contract: "Contratto", freelance: "Freelance" };

export default function JobPostings() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    department: "",
    job_level: "mid",
    location: "",
    employment_type: "full_time",
    salary_min: "",
    salary_max: "",
    description: "",
    requirements: "",
    benefits: ""
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, postings] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.JobPosting.filter({ company_id: me.company_id })
      ]);
      setCompany(companies[0]);
      setPostings(postings);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      company_id: company.id,
      ...form,
      salary_min: form.salary_min ? parseInt(form.salary_min) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      requirements: form.requirements.split('\n').filter(r => r.trim()),
      benefits: form.benefits.split('\n').filter(b => b.trim()),
      created_by: user.email,
      published_at: new Date().toISOString()
    };

    if (editingId) {
      await base44.entities.JobPosting.update(editingId, data);
    } else {
      await base44.entities.JobPosting.create(data);
    }

    const updated = await base44.entities.JobPosting.filter({ company_id: company.id });
    setPostings(updated);
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", department: "", job_level: "mid", location: "", employment_type: "full_time", salary_min: "", salary_max: "", description: "", requirements: "", benefits: "" });
  };

  const handleDelete = async (id) => {
    if (confirm("Elimina questa offerta?")) {
      await base44.entities.JobPosting.delete(id);
      setPostings(postings.filter(p => p.id !== id));
    }
  };

  const handlePublish = async (id, currentStatus) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    await base44.entities.JobPosting.update(id, {
      status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : null
    });
    const updated = await base44.entities.JobPosting.filter({ company_id: company.id });
    setPostings(updated);
  };

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Offerte di Lavoro</h1>
            <p className="text-sm text-slate-500">{company?.name}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Nuova Offerta
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Nuova Offerta di Lavoro</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Posizione *</label>
                <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Es. Senior Developer" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dipartimento *</label>
                <input type="text" required value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Es. Ingegneria" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Livello</label>
                <select value={form.job_level} onChange={e => setForm(f => ({ ...f, job_level: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(JOB_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ubicazione *</label>
                <input type="text" required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Es. Roma" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Contratto</label>
                <select value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(EMPLOYMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Stipendio Min (€)</label>
                  <input type="number" value={form.salary_min} onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Stipendio Max (€)</label>
                  <input type="number" value={form.salary_max} onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrizione *</label>
                <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Descrizione della posizione..." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Requisiti (uno per riga)</label>
                <textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Es. 5+ anni di esperienza&#10;Python e Django&#10;Comunicazione eccellente" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Benefit (uno per riga)</label>
                <textarea value={form.benefits} onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Es. Smart working&#10;Corsi di formazione&#10;Gym membership" />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50">Annulla</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Salva Offerta</button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Offerte ({postings.length})</h2>
          </div>
          {postings.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400">Nessuna offerta di lavoro ancora</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {postings.map(posting => (
                <div key={posting.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{posting.title}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${posting.status === 'published' ? 'bg-emerald-100 text-emerald-700' : posting.status === 'draft' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'}`}>
                          {posting.status === 'published' ? '📢 Pubblicata' : posting.status === 'draft' ? '📝 Bozza' : '❌ Chiusa'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{posting.department} • {posting.location}</p>
                      <div className="flex gap-3 mt-2 text-xs text-slate-500">
                        <span>{EMPLOYMENT_TYPES[posting.employment_type]}</span>
                        {posting.salary_min && <span>€{posting.salary_min.toLocaleString('it-IT')} - €{posting.salary_max?.toLocaleString('it-IT')}</span>}
                        {posting.applications_count > 0 && <span>👤 {posting.applications_count} candidati</span>}
                        {posting.published_at && <span>Pubblicata il {format(new Date(posting.published_at), 'd MMM yyyy')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePublish(posting.id, posting.status)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        title={posting.status === 'published' ? 'Disattiva' : 'Pubblica'}
                      >
                        {posting.status === 'published' ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setEditingId(posting.id); setShowForm(true); }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(posting.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}