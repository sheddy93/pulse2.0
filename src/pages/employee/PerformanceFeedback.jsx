import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const CRITERIA = {
  communication: "Comunicazione",
  teamwork: "Lavoro in Team",
  technical_skills: "Competenze Tecniche",
  reliability: "Affidabilità",
  leadership: "Leadership"
};

export default function PerformanceFeedback() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      const emp = emps[0];
      setEmployee(emp);

      if (emp) {
        const myReviews = await base44.entities.PerformanceReview.filter({
          employee_id: emp.id,
          status: "submitted"
        });
        setReviews(myReviews.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)));
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="green" />;

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviews.length : 0;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Il Mio Feedback 360°</h1>
          <p className="text-sm text-slate-500">Visualizza le valutazioni ricevute</p>
        </div>

        {/* Riepilogo */}
        {reviews.length > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white space-y-4">
            <div>
              <p className="text-sm text-blue-100">Valutazione Media</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-4xl font-bold">{avgRating.toFixed(1)}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className="text-2xl">{i <= Math.round(avgRating) ? '★' : '☆'}</span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-blue-100">Basato su {reviews.length} valutazioni ricevute</p>
          </div>
        )}

        {/* Feedback Ricevuti */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-slate-400">Nessun feedback ricevuto ancora</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">
                        {review.is_anonymous ? "Feedback Anonimo" : review.reviewer_name}
                      </h3>
                      <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-slate-100 text-slate-700">
                        {review.reviewer_role === 'manager' ? '👔 Manager' : 
                         review.reviewer_role === 'peer' ? '👥 Collega' : 
                         review.reviewer_role === 'direct_report' ? '📊 Sottoposto' : '🪞 Auto'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {review.review_period} • {format(new Date(review.submitted_at), 'd MMMM yyyy', { locale: it })}
                    </p>
                  </div>

                  {review.overall_rating > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-blue-600">{review.overall_rating}/5</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <span key={i} className="text-sm">{i <= review.overall_rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Valutazioni Criteri */}
                {review.criteria_ratings && Object.keys(review.criteria_ratings).length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Valutazioni per Criteri</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {Object.entries(CRITERIA).map(([key, label]) => {
                        const rating = review.criteria_ratings[key];
                        return rating ? (
                          <div key={key} className="text-center">
                            <p className="text-xs text-slate-600 mb-1">{label}</p>
                            <p className="text-lg font-bold text-blue-600">{rating}</p>
                            <div className="flex gap-0.5 justify-center mt-0.5">
                              {[1, 2, 3, 4, 5].map(i => (
                                <span key={i} className="text-xs">{i <= rating ? '★' : '☆'}</span>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Commenti */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  {review.strengths && (
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">💪 Punti di Forza</p>
                      <p className="text-sm text-slate-700 mt-1">{review.strengths}</p>
                    </div>
                  )}

                  {review.areas_for_improvement && (
                    <div>
                      <p className="text-sm font-semibold text-orange-700">📈 Aree di Miglioramento</p>
                      <p className="text-sm text-slate-700 mt-1">{review.areas_for_improvement}</p>
                    </div>
                  )}

                  {review.comments && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700">💬 Commenti</p>
                      <p className="text-sm text-slate-700 mt-1">{review.comments}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}