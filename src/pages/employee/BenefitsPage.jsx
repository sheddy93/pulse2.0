import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import BenefitCard from "@/components/benefits/BenefitCard";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_LABELS = {
  pending: { label: "In attesa", cls: "text-orange-700 bg-orange-50", icon: Clock },
  manager_approved: { label: "Approvato manager", cls: "text-blue-700 bg-blue-50", icon: CheckCircle2 },
  manager_rejected: { label: "Rifiutato manager", cls: "text-red-700 bg-red-50", icon: AlertCircle },
  hr_approved: { label: "Approvato HR", cls: "text-emerald-700 bg-emerald-50", icon: CheckCircle2 },
  hr_rejected: { label: "Rifiutato HR", cls: "text-red-700 bg-red-50", icon: AlertCircle },
  completed: { label: "Completato", cls: "text-emerald-700 bg-emerald-50", icon: CheckCircle2 }
};

export default function BenefitsPage() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [plans, setPlans] = useState([]);
  const [currentBenefits, setCurrentBenefits] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [selectedBenefits, setSelectedBenefits] = useState([]);
  const [enrollmentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      setEmployee(emps[0] || null);
      
      if (emps[0]) {
        const [plans, current, enrollments] = await Promise.all([
          base44.entities.BenefitPlan.filter({ company_id: emps[0].company_id, is_active: true }),
          base44.entities.EmployeeBenefit.filter({ employee_id: emps[0].id }),
          base44.entities.BenefitEnrollment.filter({ employee_id: emps[0].id })
        ]);
        setPlans(plans);
        setCurrentBenefits(current);
        setEnrollments(enrollments.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleEnrollmentSubmit = async (e) => {
    e.preventDefault();
    if (selectedBenefits.length === 0) {
      alert("Seleziona almeno un benefit");
      return;
    }

    const totalEmployeeCost = selectedBenefits.reduce((sum, id) => {
      const plan = plans.find(p => p.id === id);
      return sum + (plan?.monthly_cost_employee || 0);
    }, 0);

    const totalCompanyCost = selectedBenefits.reduce((sum, id) => {
      const plan = plans.find(p => p.id === id);
      return sum + (plan?.monthly_cost_company || 0);
    }, 0);

    await base44.entities.BenefitEnrollment.create({
      employee_id: employee.id,
      employee_email: user.email,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      company_id: employee.company_id,
      enrollment_year: enrollmentYear,
      selected_benefits: selectedBenefits.map(id => ({
        benefit_plan_id: id,
        coverage_level: "Employee"
      })),
      status: "pending",
      submitted_at: new Date().toISOString(),
      total_monthly_cost_employee: totalEmployeeCost,
      total_monthly_cost_company: totalCompanyCost
    });

    setShowEnrollment(false);
    setSelectedBenefits([]);
    const updated = await base44.entities.BenefitEnrollment.filter({ employee_id: employee.id });
    setEnrollments(updated.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
  };

  if (loading) return <PageLoader color="green" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">I Miei Benefit</h1>
          <p className="text-sm text-slate-500">Visualizza e gestisci i tuoi piani sanitari e benefit</p>
        </div>

        {/* Benefit Attuali */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Benefit Attuali</h2>
          {currentBenefits.length === 0 ? (
            <p className="text-sm text-slate-400">Nessun benefit assegnato</p>
          ) : (
            <div className="space-y-3">
              {currentBenefits.map(benefit => (
                <div key={benefit.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{benefit.benefit_name}</p>
                    <p className="text-xs text-slate-500">
                      {benefit.coverage_level && `Copertura: ${benefit.coverage_level}`}
                      {benefit.effective_date && ` • Attivo dal ${format(new Date(benefit.effective_date), "d MMM yyyy")}`}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">Attivo</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Enrollment */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Open Enrollment {enrollmentYear}</h2>
              <p className="text-sm text-slate-600 mt-1">Seleziona i tuoi benefit per l'anno prossimo</p>
            </div>
            {!showEnrollment && (
              <button
                onClick={() => setShowEnrollment(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Nuovo Enrollment
              </button>
            )}
          </div>

          {showEnrollment && (
            <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
              <p className="text-sm text-slate-600">Seleziona i benefit che desideri:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.map(plan => (
                  <BenefitCard
                    key={plan.id}
                    benefit={plan}
                    isSelected={selectedBenefits.includes(plan.id)}
                    onToggle={() => {
                      setSelectedBenefits(prev => 
                        prev.includes(plan.id)
                          ? prev.filter(id => id !== plan.id)
                          : [...prev, plan.id]
                      );
                    }}
                  />
                ))}
              </div>

              {selectedBenefits.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-slate-800">Riepilogo costi mensili</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">A tuo carico:</span>
                    <span className="font-semibold">
                      €{selectedBenefits.reduce((sum, id) => {
                        const plan = plans.find(p => p.id === id);
                        return sum + (plan?.monthly_cost_employee || 0);
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-100 pt-2">
                    <span className="text-slate-600">A carico azienda:</span>
                    <span className="font-semibold">
                      €{selectedBenefits.reduce((sum, id) => {
                        const plan = plans.find(p => p.id === id);
                        return sum + (plan?.monthly_cost_company || 0);
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowEnrollment(false); setSelectedBenefits([]); }}
                  className="flex-1 px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Invia Richiesta
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Storico Enrollment */}
        {enrollments.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Storico Richieste</h2>
            <div className="space-y-3">
              {enrollments.map(enrollment => {
                const status = STATUS_LABELS[enrollment.status];
                const StatusIcon = status.icon;
                return (
                  <div key={enrollment.id} className={`p-4 rounded-lg border ${status.cls}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="w-4 h-4" />
                        <div>
                          <p className="font-semibold text-slate-800">Enrollment {enrollment.enrollment_year}</p>
                          <p className="text-xs mt-1">
                            Inviato il {format(new Date(enrollment.submitted_at), "d MMM yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold">{status.label}</span>
                    </div>
                    {enrollment.manager_note && (
                      <p className="text-xs mt-2">Manager: {enrollment.manager_note}</p>
                    )}
                    {enrollment.hr_note && (
                      <p className="text-xs mt-1">HR: {enrollment.hr_note}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}