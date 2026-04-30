"use client";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building2, 
  FolderOpen, 
  UserPlus, 
  Briefcase, 
  FileText,
  Calendar,
  Mail,
  CheckCircle2,
  Rocket,
  Sparkles
} from "lucide-react";

/**
 * Empty States Component - PulseHR Design System
 * @component
 * @description Professional empty state illustrations with CTAs for onboarding
 */

/**
 * Base Empty State Component
 */
function EmptyStateBase({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  secondaryAction,
  illustration,
  className 
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 md:p-12", className)}>
      {/* Icon or Illustration */}
      <div className="mb-6">
        {illustration ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 blur-3xl rounded-full"></div>
            <div className="relative">
              {illustration}
            </div>
          </div>
        ) : Icon ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 blur-2xl"></div>
            <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30">
              <Icon className="w-10 h-10 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="space-y-2 mb-6 max-w-md">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
              size="lg"
              className="min-w-[160px]"
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || "outline"}
              size="lg"
              className="min-w-[160px]"
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * No Employees Empty State
 */
export function NoEmployeesEmptyState({ onAddEmployee, onImport }) {
  return (
    <EmptyStateBase
      icon={Users}
      title="Nessun dipendente ancora"
      description="Inizia aggiungendo il tuo primo dipendente al sistema. Puoi aggiungere manualmente o importare da un file."
      action={{
        label: "Aggiungi Dipendente",
        icon: UserPlus,
        onClick: onAddEmployee,
      }}
      secondaryAction={{
        label: "Importa da File",
        icon: FileText,
        onClick: onImport,
        variant: "outline",
      }}
    />
  );
}

/**
 * No Companies Empty State
 */
export function NoCompaniesEmptyState({ onAddCompany, onConnectCompany }) {
  return (
    <EmptyStateBase
      icon={Building2}
      title="Nessuna azienda collegata"
      description="Collega la tua prima azienda cliente per iniziare a gestire i loro dipendenti e processi HR."
      action={{
        label: "Collega Azienda",
        icon: Building2,
        onClick: onConnectCompany,
      }}
      secondaryAction={{
        label: "Crea Nuova",
        icon: UserPlus,
        onClick: onAddCompany,
        variant: "outline",
      }}
    />
  );
}

/**
 * No Projects Empty State
 */
export function NoProjectsEmptyState({ onCreateProject, onLearnMore }) {
  return (
    <EmptyStateBase
      icon={FolderOpen}
      title="Nessun progetto attivo"
      description="Crea il tuo primo progetto per organizzare il lavoro e monitorare il progresso del team."
      action={{
        label: "Crea Progetto",
        icon: FolderOpen,
        onClick: onCreateProject,
      }}
      secondaryAction={onLearnMore ? {
        label: "Scopri di più",
        icon: Sparkles,
        onClick: onLearnMore,
        variant: "ghost",
      } : null}
    />
  );
}

/**
 * No Departments Empty State
 */
export function NoDepartmentsEmptyState({ onAddDepartment }) {
  return (
    <EmptyStateBase
      icon={Briefcase}
      title="Nessun reparto configurato"
      description="Organizza la tua azienda creando reparti. I reparti aiutano a strutturare meglio il team."
      action={{
        label: "Crea Reparto",
        icon: Briefcase,
        onClick: onAddDepartment,
      }}
    />
  );
}

/**
 * No Schedule Empty State
 */
export function NoScheduleEmptyState({ onSetupSchedule }) {
  return (
    <EmptyStateBase
      icon={Calendar}
      title="Configura orario di lavoro"
      description="Imposta gli orari di lavoro standard per la tua azienda. Potrai personalizzarli per ogni dipendente."
      action={{
        label: "Imposta Orari",
        icon: Calendar,
        onClick: onSetupSchedule,
      }}
    />
  );
}

/**
 * No Invitations Sent Empty State
 */
export function NoInvitationsEmptyState({ onInvite }) {
  return (
    <EmptyStateBase
      icon={Mail}
      title="Invita il tuo team"
      description="Invia inviti via email ai membri del team per farli accedere alla piattaforma."
      action={{
        label: "Invia Inviti",
        icon: Mail,
        onClick: onInvite,
      }}
    />
  );
}

/**
 * Setup Complete Empty State
 */
export function SetupCompleteEmptyState({ onGoToDashboard, userName }) {
  return (
    <EmptyStateBase
      icon={CheckCircle2}
      title={`Benvenuto${userName ? `, ${userName}` : ''}!`}
      description="Configurazione completata con successo. Sei pronto per iniziare a utilizzare PulseHR."
      action={{
        label: "Vai alla Dashboard",
        icon: Rocket,
        onClick: onGoToDashboard,
      }}
      className="py-16"
    />
  );
}

/**
 * Custom Illustration Empty State
 */
export function CustomIllustrationEmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  illustrationComponent 
}) {
  return (
    <EmptyStateBase
      title={title}
      description={description}
      illustration={illustrationComponent}
      action={onAction ? {
        label: actionLabel || "Inizia",
        onClick: onAction,
      } : null}
    />
  );
}

/**
 * Generic Empty State
 */
export function GenericEmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}) {
  return (
    <EmptyStateBase
      icon={icon}
      title={title}
      description={description}
      action={onAction ? {
        label: actionLabel || "Inizia",
        onClick: onAction,
      } : null}
      secondaryAction={onSecondaryAction ? {
        label: secondaryActionLabel || "Annulla",
        onClick: onSecondaryAction,
        variant: "outline",
      } : null}
    />
  );
}

/**
 * Inline Empty State (smaller, for sections)
 */
export function InlineEmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
      {Icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 mb-3">
          <Icon className="w-6 h-6 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
        </div>
      )}
      
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {title}
      </h4>
      
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || "outline"}
          size="sm"
        >
          {action.icon && <action.icon className="w-3 h-3" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Export all components
export default {
  NoEmployeesEmptyState,
  NoCompaniesEmptyState,
  NoProjectsEmptyState,
  NoDepartmentsEmptyState,
  NoScheduleEmptyState,
  NoInvitationsEmptyState,
  SetupCompleteEmptyState,
  CustomIllustrationEmptyState,
  GenericEmptyState,
  InlineEmptyState,
};
