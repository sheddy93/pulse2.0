import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Plus, Users, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function PerformanceManagement() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    review_period: "",
    employee_id: ""
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, allReviews, allEmps] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.PerformanceReview.filter({ company_id: me.company_id }),
        base44.entities.EmployeeProfile.filter({ company_id: me.company_id })
      ]);
      setCompany(companies[0]);
      setReviews(allReviews);
      setEmployees(allEmps);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreateReviewCycle = async (e) => {
    e.preventDefault();
    if (!form.review_period) return;

    // Crea valutazione per ogni dipendente
    for (const emp of employees) {
      if (form.employee_id && form.employee_id !== emp.id) continue;

      await base44.entities.PerformanceReview.create({
        company_id: company.id,
        review_period: form.review_period,
        employee_id: emp.id,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        employee_email: emp.email,
        reviewer_id: user.email,
        reviewer_name: user.full_name,
        reviewer_email: user.email,
        reviewer_role: "manager",
        status: "draft",
        overall_rating: 0
      });
    }

    const updated = await base44.entities.PerformanceReview.filter({ company_id: company.id });
    setReviews(updated);
    setShowForm(false);
    setForm({ review_period: "", employee_id: "" });
  };

  const handleDelete = async (id) => {
    if (confirm("Elimina questa valutazione?")) {
      await base44.entities.PerformanceReview.delete(id);
      setReviews(reviews.filter(r => r.id !== id));
    }
  };

  if (loading) return <PageLoader />;

  const groupedByEmployee = reviews.reduce((acc, review) => {
    if (!acc[review.employee_id]) acc[review.employee_id] = [];
    acc[review.employee_id].push(review);
    return acc;
  }, {});

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Valutazioni Performance</h1>
            <p className="text-sm text-slate-500">{company?.name}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Nuovo Ciclo
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateReviewCycle} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Avvia Ciclo Valutazioni</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Periodo Valutazione *</label>
                <input 
                  type="text" 
                  required 
                  value={form.review_period} 
                  onChange={e => setForm(f => ({ ...f, review_period: e.target.value }))} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Es. Q2-2026"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dipendente (opzionale)</label>
                <select 
                  value={form.employee_id} 
                  onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tutti i dipendenti</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50">Annulla</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Avvia Ciclo</button>
            </div>
          </form>
        )}

        {/* Statistiche */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Valutazioni</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{reviews.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Completate</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{reviews.filter(r => r.status === 'submitted').length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">In Bozza</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{reviews.filter(r => r.status === 'draft').length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Dipendenti Valutati</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{Object.keys(groupedByEmployee).length}</p>
          </div>
        </div>

        {/* Lista Valutazioni per Dipendente */}
        <div className="space-y-4">
          {Object.entries(groupedByEmployee).map(([empId, empReviews]) => {
            const emp = employees.find(e => e.id === empId);
            const avgRating = empReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / empReviews.length;
            
            return (
              <div key={empId} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                      {emp?.first_name?.[0]}{emp?.last_name?.[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{emp?.first_name} {emp?.last_name}</h3>
                      <p className="text-xs text-slate-500">{emp?.job_title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{avgRating.toFixed(1)}</p>
                    <p className="text-xs text-slate-500">{empReviews.length} valutazioni</p>
                  </div>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {empReviews.map(review => (
                    <div key={review.id} className="px-5 py-3 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{review.review_period}</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {review.is_anonymous ? "Feedback anonimo" : `da ${review.reviewer_name}`} • {review.reviewer_role}
                        </p>
                        {review.overall_rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`text-sm ${i < review.overall_rating ? '⭐' : '☆'}`}>
                                {i < review.overall_rating ? '★' : '☆'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          review.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' :
                          review.status === 'draft' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {review.status === 'submitted' ? '✓ Inviato' : review.status === 'draft' ? '📝 Bozza' : 'Revisione'}
                        </span>
                        <button onClick={() => handleDelete(review.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}