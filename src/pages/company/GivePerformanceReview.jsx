import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Save, Send } from "lucide-react";

const CRITERIA = {
  communication: "Comunicazione",
  teamwork: "Lavoro in Team",
  technical_skills: "Competenze Tecniche",
  reliability: "Affidabilità",
  leadership: "Leadership"
};

export default function GivePerformanceReview() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [form, setForm] = useState({
    overall_rating: 0,
    communication: 0,
    teamwork: 0,
    technical_skills: 0,
    reliability: 0,
    leadership: 0,
    strengths: "",
    areas_for_improvement: "",
    comments: ""
  });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }
      const [companies, myReviews, allEmps] = await Promise.all([
        base44.entities.Company.filter({ id: me.company_id }),
        base44.entities.PerformanceReview.filter({ 
          company_id: me.company_id,
          reviewer_email: me.email,
          status: "draft"
        }),
        base44.entities.EmployeeProfile.filter({ company_id: me.company_id })
      ]);
      setCompany(companies[0]);
      setReviews(myReviews);
      setEmployees(allEmps);
    }).finally(() => setLoading(false));
  }, []);

  const handleSelectReview = (review) => {
    setSelectedReview(review);
    setForm({
      overall_rating: review.overall_rating || 0,
      communication: review.criteria_ratings?.communication || 0,
      teamwork: review.criteria_ratings?.teamwork || 0,
      technical_skills: review.criteria_ratings?.technical_skills || 0,
      reliability: review.criteria_ratings?.reliability || 0,
      leadership: review.criteria_ratings?.leadership || 0,
      strengths: review.strengths || "",
      areas_for_improvement: review.areas_for_improvement || "",
      comments: review.comments || ""
    });
  };

  const handleSave = async () => {
    if (!selectedReview) return;
    await base44.entities.PerformanceReview.update(selectedReview.id, {
      overall_rating: form.overall_rating,
      criteria_ratings: {
        communication: form.communication,
        teamwork: form.teamwork,
        technical_skills: form.technical_skills,
        reliability: form.reliability,
        leadership: form.leadership
      },
      strengths: form.strengths,
      areas_for_improvement: form.areas_for_improvement,
      comments: form.comments
    });
    alert("✓ Salvataggio in corso...");
  };

  const handleSubmit = async () => {
    if (!selectedReview) return;
    await base44.entities.PerformanceReview.update(selectedReview.id, {
      overall_rating: form.overall_rating,
      criteria_ratings: {
        communication: form.communication,
        teamwork: form.teamwork,
        technical_skills: form.technical_skills,
        reliability: form.reliability,
        leadership: form.leadership
      },
      strengths: form.strengths,
      areas_for_improvement: form.areas_for_improvement,
      comments: form.comments,
      status: "submitted",
      submitted_at: new Date().toISOString()
    });
    const updated = await base44.entities.PerformanceReview.filter({ 
      company_id: company.id,
      reviewer_email: user.email,
      status: "draft"
    });
    setReviews(updated);
    setSelectedReview(null);
    alert("✓ Valutazione inviata!");
  };

  if (loading) return <PageLoader />;

  const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl transition-colors ${star <= value ? "text-yellow-400" : "text-slate-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{value}/5</p>
    </div>
  );

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fornisci Feedback</h1>
          <p className="text-sm text-slate-500">Valutazioni da completare: {reviews.filter(r => r.status === 'draft').length}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista Dipendenti */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Da Valutare</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {reviews.map(review => (
                <button
                  key={review.id}
                  onClick={() => handleSelectReview(review)}
                  className={`w-full text-left px-5 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    selectedReview?.id === review.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                  }`}
                >
                  <p className="font-medium text-slate-800 text-sm">{review.employee_name}</p>
                  <p className="text-xs text-slate-500">{review.review_period}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Valutazione */}
          <div className="lg:col-span-2">
            {selectedReview ? (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{selectedReview.employee_name}</h3>
                  <p className="text-sm text-slate-600">{selectedReview.review_period}</p>
                </div>

                {/* Valutazione Complessiva */}
                <div className="border-t border-slate-100 pt-4">
                  <StarRating
                    value={form.overall_rating}
                    onChange={(v) => setForm(f => ({ ...f, overall_rating: v }))}
                    label="Valutazione Complessiva"
                  />
                </div>

                {/* Criteri */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h4 className="font-semibold text-slate-800">Valutazione per Criteri</h4>
                  {Object.entries(CRITERIA).map(([key, label]) => (
                    <StarRating
                      key={key}
                      value={form[key]}
                      onChange={(v) => setForm(f => ({ ...f, [key]: v }))}
                      label={label}
                    />
                  ))}
                </div>

                {/* Feedback Testuale */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Punti di Forza</label>
                    <textarea
                      value={form.strengths}
                      onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Descrivere i principali punti di forza..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Aree di Miglioramento</label>
                    <textarea
                      value={form.areas_for_improvement}
                      onChange={e => setForm(f => ({ ...f, areas_for_improvement: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Suggerire aree di miglioramento..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Commenti Aggiuntivi</label>
                    <textarea
                      value={form.comments}
                      onChange={e => setForm(f => ({ ...f, comments: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Commenti aggiuntivi..."
                    />
                  </div>
                </div>

                {/* Azioni */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg text-sm font-semibold hover:bg-blue-50"
                  >
                    <Save className="w-4 h-4" /> Salva Bozza
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" /> Invia Valutazione
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-400">Seleziona un dipendente per iniziare la valutazione</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}