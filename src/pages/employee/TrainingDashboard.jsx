import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { GraduationCap, CheckCircle2, Clock, AlertCircle, BookOpen } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { it } from "date-fns/locale";

const PLAN_TYPES = {
  onboarding: "Onboarding",
  skill_development: "Sviluppo Competenze",
  compliance: "Conformità",
  career_growth: "Crescita Carriera",
  custom: "Personalizzato"
};

export default function TrainingDashboard() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [plans, setPlans] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);

      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      const emp = emps[0];
      setEmployee(emp);

      if (emp) {
        const [plansData, skillsData] = await Promise.all([
          base44.entities.TrainingPlan.filter({ employee_id: emp.id, status: "active" }),
          base44.entities.EmployeeSkill.filter({ employee_id: emp.id })
        ]);

        setPlans(plansData.sort((a, b) => new Date(a.end_date) - new Date(b.end_date)));
        setSkills(skillsData);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="green" />;

  const stats = {
    activePlans: plans.length,
    completedCourses: plans.reduce((sum, p) => sum + (p.courses?.filter(c => c.status === "completed").length || 0), 0),
    inProgress: plans.reduce((sum, p) => sum + (p.courses?.filter(c => c.status === "in_progress").length || 0), 0),
    overdue: plans.reduce((sum, p) => sum + (p.courses?.filter(c => c.status === "overdue").length || 0), 0)
  };

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">I Tuoi Piani di Formazione</h1>
          <p className="text-slate-600 mt-2">Sviluppa le tue competenze e completa i corsi assegnati</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Piani Attivi</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.activePlans}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Corsi Completati</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.completedCourses}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">In Corso</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Scaduti</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p>
          </div>
        </div>

        {/* Piani Attivi */}
        <div className="space-y-4">
          {plans.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nessun piano di formazione assegnato</p>
              <p className="text-sm text-slate-400 mt-1">Contatta l'ufficio HR per ricevere piani di formazione</p>
            </div>
          ) : (
            plans.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900">{plan.title}</h2>
                    <p className="text-sm text-slate-600 mt-1">{plan.description}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Tipo: <span className="font-semibold">{PLAN_TYPES[plan.plan_type]}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">{plan.progress_percentage || 0}% completato</p>
                    <div className="w-32 bg-slate-200 rounded-full h-2 mt-2">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${plan.progress_percentage || 0}%` }} />
                    </div>
                  </div>
                </div>

                {/* Corsi */}
                {plan.courses && plan.courses.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <p className="font-semibold text-slate-800 text-sm">Corsi assegnati ({plan.courses.filter(c => c.status === "completed").length}/{plan.courses.length})</p>
                    <div className="space-y-2">
                      {plan.courses.map((course, idx) => {
                        const isOverdue = course.target_completion_date && isPast(parseISO(course.target_completion_date));
                        const statusIcon = course.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                                          course.status === "overdue" || isOverdue ? <AlertCircle className="w-5 h-5 text-red-500" /> :
                                          course.status === "in_progress" ? <Clock className="w-5 h-5 text-orange-500" /> :
                                          <BookOpen className="w-5 h-5 text-slate-400" />;

                        return (
                          <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${
                            course.status === "completed" ? "bg-emerald-50 border-emerald-200" :
                            isOverdue ? "bg-red-50 border-red-200" :
                            "bg-slate-50 border-slate-200"
                          }`}>
                            <div className="flex items-center gap-3 flex-1">
                              {statusIcon}
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{course.course_name}</p>
                                {course.target_completion_date && (
                                  <p className="text-xs text-slate-500">
                                    Scadenza: {format(parseISO(course.target_completion_date), "d MMM yyyy", { locale: it })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              course.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                              isOverdue ? "bg-red-100 text-red-700" :
                              course.status === "in_progress" ? "bg-orange-100 text-orange-700" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {course.status === "completed" ? "Completato" :
                               isOverdue ? "Scaduto" :
                               course.status === "in_progress" ? "In Corso" :
                               "Non Iniziato"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Competenze Target */}
                {plan.skills_target && plan.skills_target.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <p className="font-semibold text-slate-800 text-sm">Competenze da sviluppare</p>
                    <div className="space-y-2">
                      {plan.skills_target.map((target, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{target.skill_name}</p>
                            <p className="text-xs text-slate-500">
                              {target.current_level} → {target.target_level}
                            </p>
                          </div>
                          {target.deadline && (
                            <p className="text-xs text-slate-500">
                              Entro: {format(parseISO(target.deadline), "d MMM", { locale: it })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm">
                    Visualizza Dettagli
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Le Mie Competenze */}
        {skills.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Le Tue Competenze Attuali</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills.filter(s => s.status === "active").map(skill => (
                <div key={skill.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{skill.skill_name}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Livello: <span className="font-bold capitalize">{skill.proficiency_level}</span>
                      </p>
                    </div>
                    {skill.expiry_date && (
                      <p className="text-xs text-slate-500 text-right">
                        Scade: {format(parseISO(skill.expiry_date), "d MMM", { locale: it })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}