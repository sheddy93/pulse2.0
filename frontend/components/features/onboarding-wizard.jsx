"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  X,
  Upload,
  FileText,
  User,
  Building2,
  Bell,
  ArrowRight,
  Play,
  SkipForward,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Card, CardContent } from "@/components/ui/card";

/**
 * OnboardingWizard - Multi-step interactive onboarding
 * Guides new users through initial setup
 */

// Onboarding steps configuration
const ONBOARDING_STEPS = {
  WELCOME: {
    id: "welcome",
    title: "Benvenuto in Pulse!",
    subtitle: "Configuriamo insieme il tuo spazio di lavoro",
    icon: Sparkles,
  },
  PROFILE: {
    id: "profile",
    title: "Completa il profilo",
    subtitle: "Aggiungi le tue informazioni personali",
    icon: User,
  },
  COMPANY: {
    id: "company",
    title: "Informazioni azienda",
    subtitle: "Verifica i dati della tua organizzazione",
    icon: Building2,
  },
  NOTIFICATIONS: {
    id: "notifications",
    title: "Configura notifiche",
    subtitle: "Scegli come essere avvisato",
    icon: Bell,
  },
  COMPLETE: {
    id: "complete",
    title: "Tutto pronto!",
    subtitle: "Pulse e' configurato e pronto all'uso",
    icon: CheckCircle2,
  },
};

// Welcome step content
function WelcomeStep({ onNext, onSkip }) {
  return (
    <div className="text-center space-y-6 py-8">
      {/* Animated icon */}
      <div className="relative mx-auto w-24 h-24">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
        <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-primary-strong rounded-full flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {ONBOARDING_STEPS.WELCOME.title}
        </h2>
        <p className="text-muted max-w-sm mx-auto">
          {ONBOARDING_STEPS.WELCOME.subtitle}
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        {[
          { icon: User, label: "Gestione HR" },
          { icon: Bell, label: "Notifiche" },
          { icon: FileText, label: "Documenti" },
        ].map((feature, i) => (
          <div key={i} className="p-4 rounded-xl bg-bg-muted border border-border">
            <feature.icon className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium text-foreground">{feature.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
        <button onClick={onNext} className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-base inline-flex items-center justify-center gap-2 font-semibold">
          Inizia configurazione
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
        <button onClick={onSkip} className="px-4 py-2 bg-transparent hover:bg-accent text-muted rounded-lg inline-flex items-center justify-center gap-2">
          <SkipForward className="w-4 h-4 mr-2" />
          Salta configurazione
        </button>
      </div>
    </div>
  );
}

// Profile completion step
function ProfileStep({ data, onChange, onNext, onBack }) {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
          <User className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{ONBOARDING_STEPS.PROFILE.title}</h2>
        <p className="text-sm text-muted">{ONBOARDING_STEPS.PROFILE.subtitle}</p>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        {/* Avatar upload */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-bg-muted border border-border">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            {data.avatar ? (
              <img src={data.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Foto profilo</p>
            <p className="text-xs text-muted">Aggiungi una foto per essere riconosciuto</p>
          </div>
          <button className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent text-sm inline-flex items-center justify-center gap-2">
            <Upload className="w-4 h-4 mr-1" />
            Carica
          </button>
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Numero di telefono
          </label>
          <input
            type="tel"
            value={data.phone || ""}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            placeholder="+39 333 1234567"
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {/* Department */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Reparto
          </label>
          <select
            value={data.department || ""}
            onChange={(e) => onChange({ ...data, department: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">Seleziona reparto</option>
            <option value="hr">Risorse Umane</option>
            <option value="sales">Vendite</option>
            <option value="it">IT</option>
            <option value="finance">Finanza</option>
            <option value="operations">Operazioni</option>
          </select>
        </div>

        {/* Role */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Ruolo
          </label>
          <input
            type="text"
            value={data.role || ""}
            onChange={(e) => onChange({ ...data, role: e.target.value })}
            placeholder="Es. Responsabile Vendite"
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 max-w-sm mx-auto">
        <button onClick={onBack} className="px-4 py-2 bg-transparent hover:bg-accent text-foreground rounded-lg inline-flex items-center justify-center gap-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Indietro
        </button>
        <button onClick={onNext} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center justify-center gap-2 font-semibold">
          Continua
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

// Company info step
function CompanyStep({ data, onChange, onNext, onBack }) {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Building2 className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{ONBOARDING_STEPS.COMPANY.title}</h2>
        <p className="text-sm text-muted">{ONBOARDING_STEPS.COMPANY.subtitle}</p>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        {/* Company preview */}
        <div className="p-4 rounded-xl bg-bg-muted border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{data.companyName || "Nome Azienda"}</p>
              <p className="text-xs text-muted">{data.vatNumber || "P.IVA: -"}</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Indirizzo sede
          </label>
          <input
            type="text"
            value={data.address || ""}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            placeholder="Via Roma 123, Milano"
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Settore
          </label>
          <select
            value={data.industry || ""}
            onChange={(e) => onChange({ ...data, industry: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">Seleziona settore</option>
            <option value="tech">Tecnologia</option>
            <option value="manufacturing">Manifatturiero</option>
            <option value="retail">Retail</option>
            <option value="services">Servizi</option>
            <option value="finance">Finanza</option>
          </select>
        </div>

        {/* Employee count */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Numero dipendenti
          </label>
          <select
            value={data.employeeCount || ""}
            onChange={(e) => onChange({ ...data, employeeCount: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">Seleziona</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201+">201+</option>
          </select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 max-w-sm mx-auto">
        <button onClick={onBack} className="px-4 py-2 bg-transparent hover:bg-accent text-foreground rounded-lg inline-flex items-center justify-center gap-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Indietro
        </button>
        <button onClick={onNext} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center justify-center gap-2 font-semibold">
          Continua
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

// Notifications step
function NotificationsStep({ data, onChange, onNext, onBack }) {
  const toggleNotification = (key) => {
    onChange({
      ...data,
      notifications: {
        ...data.notifications,
        [key]: !data.notifications[key],
      },
    });
  };

  const notificationOptions = [
    { key: "leaveRequests", label: "Richieste ferie", description: "Quando qualcuno richiede ferie" },
    { key: "approvals", label: "Approvazioni", description: "Stato delle tue richieste" },
    { key: "documents", label: "Documenti", description: "Nuovi documenti da firmare" },
    { key: "reminders", label: "Promemoria", description: "Check-in e scadenze" },
    { key: "weekly", label: "Riepilogo settimanale", description: "Report attivita' settimanale" },
  ];

  return (
    <div className="space-y-6 py-4">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Bell className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{ONBOARDING_STEPS.NOTIFICATIONS.title}</h2>
        <p className="text-sm text-muted">{ONBOARDING_STEPS.NOTIFICATIONS.subtitle}</p>
      </div>

      <div className="space-y-3 max-w-sm mx-auto">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className={cn(
              "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
              data.notifications?.[option.key]
                ? "bg-primary/5 border-primary/30"
                : "bg-bg-muted border-border hover:border-border/80"
            )}
            onClick={() => toggleNotification(option.key)}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                data.notifications?.[option.key]
                  ? "bg-primary text-white"
                  : "bg-bg-muted text-muted"
              )}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{option.label}</p>
                <p className="text-xs text-muted">{option.description}</p>
              </div>
            </div>
            <div className={cn(
              "w-11 h-6 rounded-full transition-colors relative",
              data.notifications?.[option.key] ? "bg-primary" : "bg-border"
            )}>
              <span className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                data.notifications?.[option.key] ? "left-6" : "left-1"
              )} />
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 max-w-sm mx-auto">
        <button onClick={onBack} className="px-4 py-2 bg-transparent hover:bg-accent text-foreground rounded-lg inline-flex items-center justify-center gap-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Indietro
        </button>
        <button onClick={onNext} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center justify-center gap-2 font-semibold">
          Completa
          <CheckCircle2 className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}

// Completion step
function CompleteStep({ onFinish }) {
  return (
    <div className="text-center space-y-6 py-8">
      {/* Animated success */}
      <div className="relative mx-auto w-24 h-24">
        <div className="absolute inset-0 bg-success/20 rounded-full animate-pulse" />
        <div className="relative w-24 h-24 bg-gradient-to-br from-success to-emerald-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {ONBOARDING_STEPS.COMPLETE.title}
        </h2>
        <p className="text-muted max-w-sm mx-auto">
          {ONBOARDING_STEPS.COMPLETE.subtitle}
        </p>
      </div>

      {/* Summary */}
      <div className="bg-bg-muted rounded-xl p-4 max-w-sm mx-auto">
        <p className="text-sm text-muted mb-3">Cosa puoi fare ora:</p>
        <div className="space-y-2 text-left">
          {[
            "Gestire presenze e ferie",
            "Revisionare documenti",
            "Creare report personalizzati",
            "Collaborare con il tuo team",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onFinish} className="w-full max-w-xs px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-base mt-4 inline-flex items-center justify-center gap-2 font-semibold">
        Vai alla Dashboard
        <ArrowRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  );
}

// Progress indicator
function ProgressIndicator({ currentStep, totalSteps, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepKeys = Object.keys(steps);
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;

        return (
          <div key={i} className="flex items-center">
            <div
              className={cn(
                "w-8 h-2 rounded-full transition-all",
                isActive && "bg-primary w-12",
                isCompleted && "bg-success",
                !isActive && !isCompleted && "bg-border"
              )}
            />
            {i < totalSteps - 1 && <div className="w-2" />}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Main OnboardingWizard component
 */
export function OnboardingWizard({ onComplete, onSkip, initialStep = 0 }) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState({
    phone: "",
    department: "",
    role: "",
    companyName: "Acme Corporation",
    vatNumber: "IT12345678901",
    address: "",
    industry: "",
    employeeCount: "",
    notifications: {
      leaveRequests: true,
      approvals: true,
      documents: true,
      reminders: false,
      weekly: false,
    },
  });

  const steps = Object.keys(ONBOARDING_STEPS);
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const handleFinish = () => {
    onComplete?.(formData);
  };

  const stepKeys = Object.keys(ONBOARDING_STEPS);
  const currentStepId = stepKeys[currentStep];

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl border-border/50 overflow-hidden">
      {/* Header with close */}
      <div className="relative px-6 pt-6 pb-2">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted" />
        </button>

        {/* Progress */}
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          steps={ONBOARDING_STEPS}
        />
      </div>

      {/* Content */}
      <CardContent className="px-6 pb-6">
        {currentStepId === "WELCOME" && (
          <WelcomeStep onNext={handleNext} onSkip={handleSkip} />
        )}
        {currentStepId === "PROFILE" && (
          <ProfileStep
            data={formData}
            onChange={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStepId === "COMPANY" && (
          <CompanyStep
            data={formData}
            onChange={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStepId === "NOTIFICATIONS" && (
          <NotificationsStep
            data={formData}
            onChange={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStepId === "COMPLETE" && (
          <CompleteStep onFinish={handleFinish} />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Tooltip for guided tour
 */
export function TourTooltip({ step, total, title, content, onNext, onBack, onSkip }) {
  return (
    <div className="bg-surface border border-border rounded-xl shadow-xl p-4 max-w-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted">Passo {step + 1} di {total}</span>
        <button onClick={onSkip} className="text-xs text-muted hover:text-foreground">
          Salta tour
        </button>
      </div>
      <h4 className="font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted mb-4">{content}</p>
      <div className="flex justify-between">
        {step > 0 ? (
          <button onClick={onBack} className="px-4 py-1.5 bg-transparent hover:bg-accent text-foreground rounded-lg text-sm inline-flex items-center justify-center gap-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Indietro
          </button>
        ) : <div />}
        <button onClick={onNext} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm inline-flex items-center justify-center gap-2 font-semibold">
          {step < total - 1 ? "Avanti" : "Fine"}
          {step < total - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
        </button>
      </div>
    </div>
  );
}

export default OnboardingWizard;
