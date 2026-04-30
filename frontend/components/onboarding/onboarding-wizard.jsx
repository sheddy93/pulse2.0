"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import StepIndicator from "@/components/forms/step-indicator";
import { X, ArrowLeft, ArrowRight, Save, CheckCircle2 } from "lucide-react";
import { OnboardingPageLoading } from "./loading-states";

/**
 * OnboardingWizard Component - PulseHR Design System
 * @component
 * @description Full-screen wizard container for onboarding flows
 * 
 * Features:
 * - Full-screen immersive experience
 * - Progress indicator
 * - Keyboard navigation (ESC to close, Enter to continue)
 * - Auto-save functionality
 * - Step validation
 * - Glass-morphism design
 */

export default function OnboardingWizard({
  flow,
  initialStep = 0,
  onComplete,
  onClose,
  onSave,
  userData = {},
  autoSave = true,
  className,
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stepData, setStepData] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const currentStep = flow?.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === flow?.steps.length - 1;
  const progress = ((currentStepIndex + 1) / flow?.steps.length) * 100;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC to close
      if (e.key === "Escape" && onClose) {
        handleClose();
      }
      
      // Enter to continue (only if not in input)
      if (e.key === "Enter" && !["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
        if (!isLastStep) {
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStepIndex, isLastStep]);

  // Auto-save on step change
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && onSave) {
      const timeoutId = setTimeout(() => {
        handleAutoSave();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [stepData, hasUnsavedChanges]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    if (isLastStep) {
      await handleComplete();
    } else {
      setIsLoading(true);
      
      // Simulate validation/processing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCurrentStepIndex(prev => Math.min(prev + 1, flow.steps.length - 1));
      setIsLoading(false);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStepIndex, flow, isLastStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleStepClick = useCallback((stepIndex) => {
    // Only allow going back to completed steps
    if (stepIndex < currentStepIndex) {
      setCurrentStepIndex(stepIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStepIndex]);

  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Save final data
      if (onSave) {
        await onSave(stepData);
      }
      
      // Mark onboarding as complete
      if (onComplete) {
        await onComplete(stepData);
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  }, [stepData, onComplete, onSave]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        "Hai modifiche non salvate. Sei sicuro di voler uscire?"
      );
      if (!confirmClose) return;
    }
    
    if (onClose) {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleAutoSave = useCallback(async () => {
    setIsSaving(true);
    
    try {
      if (onSave) {
        await onSave({
          ...stepData,
          currentStep: currentStepIndex,
          lastSaved: new Date().toISOString(),
        });
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [stepData, currentStepIndex, onSave]);

  const updateStepData = useCallback((data) => {
    setStepData(prev => ({
      ...prev,
      [currentStep.id]: {
        ...prev[currentStep.id],
        ...data,
      },
    }));
    setHasUnsavedChanges(true);
  }, [currentStep]);

  // Show loading if no flow
  if (!flow || !flow.steps) {
    return <OnboardingPageLoading message="Caricamento configurazione..." />;
  }

  const StepComponent = currentStep?.component;

  return (
    <div className={cn(
      "fixed inset-0 z-50 overflow-hidden",
      "bg-gradient-to-br from-violet-50 via-white to-indigo-50",
      "dark:from-slate-900 dark:via-slate-800 dark:to-slate-900",
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-violet-300 dark:bg-violet-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo / Title */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-lg">
                  P
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                    PulseHR
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configurazione Iniziale
                  </p>
                </div>
              </div>

              {/* Progress Info */}
              <div className="hidden md:flex items-center gap-4">
                {isSaving && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-4 h-4 border-2 border-t-violet-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    Salvataggio...
                  </div>
                )}
                {!isSaving && hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <Save className="w-4 h-4" />
                    Modifiche non salvate
                  </div>
                )}
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Passo {currentStepIndex + 1} di {flow.steps.length}
                </div>
              </div>

              {/* Close Button */}
              {onClose && (
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 py-6">
          <div className="container mx-auto px-6">
            <StepIndicator
              steps={flow.steps.map(step => ({
                label: step.label,
                description: step.description,
              }))}
              currentStep={currentStepIndex}
              onStepClick={handleStepClick}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-[calc(100vh-240px)] overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Glass Card Container */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-8 md:p-12">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <div className="inline-block w-12 h-12 border-4 border-t-violet-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500">Caricamento...</p>
                  </div>
                </div>
              ) : StepComponent ? (
                <StepComponent
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  onSkip={handleSkip}
                  onSave={updateStepData}
                  onComplete={handleComplete}
                  userData={userData}
                  stepData={stepData[currentStep.id] || {}}
                  isFirstStep={isFirstStep}
                  isLastStep={isLastStep}
                />
              ) : (
                <div className="text-center py-20">
                  <p className="text-slate-500">Contenuto non disponibile</p>
                </div>
              )}
            </div>

            {/* Navigation Hints (Mobile) */}
            <div className="md:hidden mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
              {!isFirstStep && (
                <div className="flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  <span>Indietro</span>
                </div>
              )}
              {!isLastStep && (
                <div className="flex items-center gap-1">
                  <span>Avanti</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 py-4">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>
              <span className="font-medium">PulseHR</span> - Sistema di Gestione HR
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span>Premi ESC per chiudere</span>
              {!isLastStep && <span>Premi Enter per continuare</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Onboarding Wizard Hook
 * @hook
 * @description Custom hook for managing wizard state
 */
export function useOnboardingWizard(flow, options = {}) {
  const [isOpen, setIsOpen] = useState(options.initialOpen || false);
  const [currentStep, setCurrentStep] = useState(options.initialStep || 0);
  const [wizardData, setWizardData] = useState({});

  const openWizard = useCallback(() => setIsOpen(true), []);
  const closeWizard = useCallback(() => setIsOpen(false), []);
  
  const handleComplete = useCallback(async (data) => {
    if (options.onComplete) {
      await options.onComplete(data);
    }
    closeWizard();
  }, [options.onComplete]);

  const handleSave = useCallback(async (data) => {
    setWizardData(data);
    if (options.onSave) {
      await options.onSave(data);
    }
  }, [options.onSave]);

  return {
    isOpen,
    openWizard,
    closeWizard,
    currentStep,
    wizardData,
    handleComplete,
    handleSave,
  };
}
