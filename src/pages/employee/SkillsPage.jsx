import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";

const SKILL_TYPES = { technical: "Tecnica", certification: "Certificazione", course: "Corso" };
const PROFICIENCY = { beginner: "Base", intermediate: "Intermedio", advanced: "Avanzato", expert: "Esperto" };
const SKILL_COLORS = {
  technical: "bg-blue-100 text-blue-700",
  certification: "bg-purple-100 text-purple-700",
  course: "bg-orange-100 text-orange-700"
};

export default function SkillsPage() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const [emps, skillsData] = await Promise.all([
        base44.entities.EmployeeProfile.filter({ user_email: me.email }),
        base44.entities.EmployeeSkill.filter({ })
      ]);
      if (emps.length > 0) {
        setEmployee(emps[0]);
        setSkills(skillsData.filter(s => s.employee_id === emps[0].id));
      }
    }).finally(() => setLoading(false));
  }, []);

  const expiringSoon = skills.filter(s => s.expiry_date && differenceInDays(new Date(s.expiry_date), new Date()) <= 30 && differenceInDays(new Date(s.expiry_date), new Date()) >= 0);
  const expired = skills.filter(s => s.expiry_date && differenceInDays(new Date(s.expiry_date), new Date()) < 0);
  const active = skills.filter(s => !s.expiry_date || (s.expiry_date && new Date(s.expiry_date) >= new Date()));

  if (loading) return <PageLoader color="green" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Le mie competenze</h1>
          <p className="text-sm text-slate-500">Visualizza tutte le tue skill, certificazioni e corsi</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{active.length}</p>
            <p className="text-xs text-slate-500 mt-1">Competenze attive</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{expiringSoon.length}</p>
            <p className="text-xs text-slate-500 mt-1">In scadenza</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{expired.length}</p>
            <p className="text-xs text-slate-500 mt-1">Scadute</p>
          </div>
        </div>

        {/* Alerts */}
        {expired.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-800"><strong>{expired.length} certificazioni scadute</strong> - Contatta l'admin per l'aggiornamento</span>
          </div>
        )}
        {expiringSoon.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-amber-800"><strong>{expiringSoon.length} certificazioni in scadenza</strong> entro 30 giorni</span>
          </div>
        )}

        {/* Skills */}
        {skills.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">Nessuna competenza registrata</p>
            <p className="text-xs text-slate-400 mt-1">Contatta l'admin per aggiungere le tue skill</p>
          </div>
        ) : (
          <div className="space-y-4">
            {skills.map(skill => {
              const days = skill.expiry_date ? differenceInDays(new Date(skill.expiry_date), new Date()) : null;
              const isExpired = days !== null && days < 0;
              const isExpiring = days !== null && days >= 0 && days <= 30;
              
              return (
                <div key={skill.id} className={`rounded-lg border p-4 ${isExpired ? 'bg-red-50 border-red-200' : isExpiring ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{skill.skill_name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SKILL_COLORS[skill.skill_type]}`}>
                          {SKILL_TYPES[skill.skill_type]}
                        </span>
                        {!skill.expiry_date ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">Permanente</span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">Scaduto</span>
                        ) : isExpiring ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">Scade in {days}gg</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">Valido</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                        {skill.skill_category && <span>Categoria: <strong>{skill.skill_category}</strong></span>}
                        <span>Livello: <strong>{PROFICIENCY[skill.proficiency_level]}</strong></span>
                        <span>Acquisito: <strong>{format(new Date(skill.acquired_date), 'd MMM yyyy', { locale: it })}</strong></span>
                      </div>
                      {skill.issuer && <p className="text-xs text-slate-600 mt-2">Ente: <strong>{skill.issuer}</strong></p>}
                      {skill.certification_number && <p className="text-xs text-slate-600">Certificato: <strong>{skill.certification_number}</strong></p>}
                      {skill.expiry_date && <p className="text-xs text-slate-600 mt-1">Scadenza: <strong>{format(new Date(skill.expiry_date), 'd MMM yyyy', { locale: it })}</strong></p>}
                      {skill.notes && <p className="text-xs text-slate-600 mt-2 italic">Nota: "{skill.notes}"</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}