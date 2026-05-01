import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import StepProfile from "@/components/onboarding/StepProfile";
import StepContract from "@/components/onboarding/StepContract";
import StepDocuments from "@/components/onboarding/StepDocuments";
import StepReview from "@/components/onboarding/StepReview";
import { CheckCircle2, Circle, ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = [
  { number: 1, title: "Profilo", description: "Completa i tuoi dati personali" },
  { number: 2, title: "Contratto", description: "Firma il tuo contratto" },
  { number: 3, title: "Documenti", description: "Carica i documenti obbligatori" },
  { number: 4, title: "Revisione", description: "Conferma e invia per revisione" }
];

export default function OnboardingWizard() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // TODO: Replace with authService.me() and service calls
    setLoading(false);
  }, []);

  const handleStepComplete = async (stepData) => {
    if (!onboarding || !employee) return;

    const updates = {
      current_step: Math.min(currentStep + 1, 4),
      ...stepData
    };

    // Calcola overall_progress
    let progress = 0;
    if (onboarding.step_1_profile_completed || stepData.step_1_profile_completed) progress += 25;
    if (onboarding.step_2_contract_signed || stepData.step_2_contract_signed) progress += 25;
    if (onboarding.step_3_documents_uploaded || stepData.step_3_documents_uploaded) progress += 25;
    if (onboarding.step_4_review_completed || stepData.step_4_review_completed) progress += 25;

    updates.overall_progress = progress;

    if (progress === 100) {
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
    }

    await base44.entities.OnboardingProgress.update(onboarding.id, updates);
    const updated = await base44.entities.OnboardingProgress.filter({
      employee_id: employee.id
    });
    setOnboarding(updated[0]);
    setCurrentStep(Math.min(currentStep + 1, 4));
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) return <PageLoader color="green" />;

  if (!onboarding) {
    return (
      <AppShell user={user}>
        <div className="p-6">
          <p className="text-slate-500">Caricamento onboarding...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-slate-900">Benvenuto in {employee?.company_id ? "Azienda" : "PulseHR"}</h1>
            <p className="text-slate-600">Completa questi step per iniziare il tuo lavoro</p>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-slate-700">Avanzamento: {onboarding.overall_progress || 0}%</p>
              <span className="text-sm font-bold text-blue-600">{currentStep} di 4</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps Timeline */}
          <div className="flex justify-between mb-8">
            {STEPS.map((step, idx) => {
              const isCompleted = currentStep > step.number || (currentStep === step.number && onboarding[`step_${step.number}_profile_completed`] || onboarding[`step_${step.number}_contract_signed`] || onboarding[`step_${step.number}_documents_uploaded`] || onboarding[`step_${step.number}_review_completed`]);
              const isActive = currentStep === step.number;

              return (
                <div key={step.number} className="flex flex-col items-center flex-1">
                  <div className="relative mb-3 flex items-center w-full">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isActive
                          ? "bg-blue-600 text-white ring-4 ring-blue-100"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.number}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          isCompleted ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                  <p className={`text-xs font-semibold ${isActive ? "text-blue-600" : isCompleted ? "text-emerald-600" : "text-slate-600"}`}>
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 min-h-96">
            {currentStep === 1 && (
              <StepProfile employee={employee} onComplete={handleStepComplete} />
            )}
            {currentStep === 2 && (
              <StepContract employee={employee} onboarding={onboarding} onComplete={handleStepComplete} />
            )}
            {currentStep === 3 && (
              <StepDocuments employee={employee} onboarding={onboarding} onComplete={handleStepComplete} />
            )}
            {currentStep === 4 && (
              <StepReview employee={employee} onboarding={onboarding} onComplete={handleStepComplete} />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Indietro
            </button>
            <div className="text-center text-sm text-slate-600">
              Step {currentStep} di 4
            </div>
            <div className="w-24" /> {/* Spacer */}
          </div>
        </div>
      </div>
    </AppShell>
  );
}