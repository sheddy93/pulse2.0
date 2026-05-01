import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Plus, Edit2, Trash2, Users, Eye, Lock } from "lucide-react";

const CATEGORIES = { safety: "Sicurezza", compliance: "Conformità", technical: "Tecnico", leadership: "Leadership", general: "Generale", other: "Altro" };

export default function TrainingManagement() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    is_mandatory: false,
    provider: "",
    duration_hours: "",
    expiry_months: "",
    cost: "",
    course_url: "",
    course_material_url: ""
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, courses] = await Promise.all([
        // TODO: Replace with service.Company.filter({ id: me.company_id }),
        // TODO: Replace with service.TrainingCourse.filter({ company_id: me.company_id })
      ]);
      setCompany(companies[0]);
      setCourses(courses);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      company_id: company.id,
      ...form,
      duration_hours: form.duration_hours ? parseInt(form.duration_hours) : null,
      expiry_months: form.expiry_months ? parseInt(form.expiry_months) : null,
      cost: form.cost ? parseFloat(form.cost) : null,
      created_by: user.email
    };

    if (editingId) {
      // TODO: Replace with service.TrainingCourse.update(editingId, data);
    } else {
      // TODO: Replace with service.TrainingCourse.create(data);
    }

    const updated = // TODO: Replace with service.TrainingCourse.filter({ company_id: company.id });
    setCourses(updated);
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", description: "", category: "general", is_mandatory: false, provider: "", duration_hours: "", expiry_months: "", cost: "", course_url: "", course_material_url: "" });
  };

  const handleDelete = async (id) => {
    if (confirm("Elimina questo corso?")) {
      // TODO: Replace with service.TrainingCourse.delete(id);
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestione Corsi di Formazione</h1>
            <p className="text-sm text-slate-500">{company?.name}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Nuovo Corso
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Nuovo Corso di Formazione</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Titolo Corso *</label>
                <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Es. Primo Soccorso" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descrizione</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Descrizione del corso..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="mandatory" checked={form.is_mandatory} onChange={e => setForm(f => ({ ...f, is_mandatory: e.target.checked }))} className="w-4 h-4" />
                <label htmlFor="mandatory" className="text-sm font-semibold text-slate-600">Corso obbligatorio</label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Provider</label>
                <input type="text" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Es. Esterno / Interno" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Durata (ore)</label>
                <input type="number" value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Validità (mesi)</label>
                <input type="number" value={form.expiry_months} onChange={e => setForm(f => ({ ...f, expiry_months: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="null = senza scadenza" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Costo (€)</label>
                <input type="number" step="0.01" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">URL Corso</label>
                <input type="url" value={form.course_url} onChange={e => setForm(f => ({ ...f, course_url: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">URL Materiali</label>
                <input type="url" value={form.course_material_url} onChange={e => setForm(f => ({ ...f, course_material_url: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50">Annulla</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Salva Corso</button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Catalogo Corsi ({courses.length})</h2>
          </div>
          {courses.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400">Nessun corso ancora</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {courses.map(course => (
                <div key={course.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{course.title}</h3>
                        {course.is_mandatory && <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-red-100 text-red-700">Obbligatorio</span>}
                        <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${course.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {course.status === 'active' ? '✓ Attivo' : '📝 Bozza'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{CATEGORIES[course.category]} • {course.provider || "—"}</p>
                      {course.description && <p className="text-sm text-slate-500 mt-1">{course.description.substring(0, 100)}...</p>}
                      <div className="flex gap-3 mt-2 text-xs text-slate-500">
                        {course.duration_hours && <span>⏱️ {course.duration_hours}h</span>}
                        {course.expiry_months && <span>📅 Valido {course.expiry_months} mesi</span>}
                        {course.cost && <span>💰 €{course.cost}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingId(course.id); setShowForm(true); }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
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