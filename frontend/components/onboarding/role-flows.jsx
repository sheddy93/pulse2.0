"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  User, 
  Heart, 
  CreditCard, 
  Bell, 
  Building2, 
  Image as ImageIcon, 
  Clock, 
  Users, 
  LayoutGrid, 
  DollarSign, 
  Target, 
  Link2, 
  Upload, 
  Settings, 
  Mail, 
  Package,
  CheckCircle2,
  Sparkles
} from "lucide-react";

/**
 * Role-Specific Flows Component - PulseHR Design System
 * @component
 * @description Defines onboarding steps and content for different user roles
 */

// ========================================
// EMPLOYEE FLOW (Dipendente)
// ========================================

export const employeeFlow = {
  role: "employee",
  steps: [
    {
      id: "welcome",
      label: "Benvenuto",
      icon: User,
      component: WelcomeStep,
    },
    {
      id: "profile",
      label: "Profilo",
      icon: User,
      component: ProfileSetupStep,
    },
    {
      id: "emergency",
      label: "Contatti Emergenza",
      icon: Heart,
      component: EmergencyContactsStep,
    },
    {
      id: "bank",
      label: "Dati Bancari",
      icon: CreditCard,
      component: BankDetailsStep,
    },
    {
      id: "preferences",
      label: "Preferenze",
      icon: Bell,
      component: PreferencesStep,
    },
    {
      id: "complete",
      label: "Completa",
      icon: CheckCircle2,
      component: CompleteStep,
    },
  ],
};

// ========================================
// COMPANY ADMIN FLOW (Amministratore Azienda)
// ========================================

export const companyAdminFlow = {
  role: "company_admin",
  steps: [
    {
      id: "welcome",
      label: "Benvenuto",
      icon: Building2,
      component: AdminWelcomeStep,
    },
    {
      id: "company",
      label: "Conferma Azienda",
      icon: Building2,
      component: CompanyConfirmationStep,
    },
    {
      id: "logo",
      label: "Logo Aziendale",
      icon: ImageIcon,
      component: CompanyLogoStep,
    },
    {
      id: "schedule",
      label: "Orario Lavoro",
      icon: Clock,
      component: WorkScheduleStep,
    },
    {
      id: "employees",
      label: "Invita Dipendenti",
      icon: Users,
      component: InviteEmployeesStep,
    },
    {
      id: "departments",
      label: "Reparti",
      icon: LayoutGrid,
      component: DepartmentsStep,
    },
    {
      id: "payroll",
      label: "Impostazioni Buste Paga",
      icon: DollarSign,
      component: PayrollSettingsStep,
    },
    {
      id: "complete",
      label: "Revisione",
      icon: CheckCircle2,
      component: AdminCompleteStep,
    },
  ],
};

// ========================================
// CONSULTANT FLOW (Consulente)
// ========================================

export const consultantFlow = {
  role: "consultant",
  steps: [
    {
      id: "welcome",
      label: "Benvenuto",
      icon: Sparkles,
      component: ConsultantWelcomeStep,
    },
    {
      id: "specializations",
      label: "Specializzazioni",
      icon: Target,
      component: SpecializationsStep,
    },
    {
      id: "clients",
      label: "Collega Aziende",
      icon: Link2,
      component: ConnectClientsStep,
    },
    {
      id: "import",
      label: "Importa Dati",
      icon: Upload,
      component: ImportDataStep,
    },
    {
      id: "notifications",
      label: "Notifiche",
      icon: Bell,
      component: NotificationPreferencesStep,
    },
    {
      id: "complete",
      label: "Completa",
      icon: CheckCircle2,
      component: ConsultantCompleteStep,
    },
  ],
};

// ========================================
// PLATFORM ADMIN FLOW (Admin)
// ========================================

export const platformAdminFlow = {
  role: "platform_admin",
  steps: [
    {
      id: "welcome",
      label: "Benvenuto Admin",
      icon: Settings,
      component: PlatformAdminWelcomeStep,
    },
    {
      id: "system",
      label: "Configurazione Sistema",
      icon: Settings,
      component: SystemConfigStep,
    },
    {
      id: "pricing",
      label: "Piani Tariffari",
      icon: Package,
      component: PricingPlansStep,
    },
    {
      id: "email",
      label: "Template Email",
      icon: Mail,
      component: EmailTemplatesStep,
    },
    {
      id: "integrations",
      label: "Integrazioni",
      icon: Link2,
      component: IntegrationsStep,
    },
    {
      id: "complete",
      label: "Completa",
      icon: CheckCircle2,
      component: PlatformAdminCompleteStep,
    },
  ],
};

// ========================================
// STEP COMPONENTS (Placeholders - to be implemented)
// ========================================

// Generic Welcome Step
function WelcomeStep({ onNext, userData }) {
  return (
    <StepContainer
      title={`Benvenuto, ${userData?.firstName || 'Dipendente'}!`}
      description="Siamo felici di averti a bordo. Configuriamo il tuo profilo in pochi semplici passaggi."
      icon={User}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon={User}
            title="Profilo Completo"
            description="Completa le tue informazioni personali"
          />
          <FeatureCard
            icon={Bell}
            title="Resta Aggiornato"
            description="Configura le tue preferenze di notifica"
          />
          <FeatureCard
            icon={CreditCard}
            title="Buste Paga"
            description="Aggiungi i tuoi dati bancari"
          />
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={onNext} size="lg">
            Inizia Configurazione
          </Button>
        </div>
      </div>
    </StepContainer>
  );
}

function ProfileSetupStep({ onNext, onPrevious, onSave, initialData }) {
  return (
    <StepContainer
      title="Completa il tuo Profilo"
      description="Aggiungi le tue informazioni personali per personalizzare l'esperienza."
      icon={User}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Form fields would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <Button onClick={onNext}>Continua</Button>
        </div>
      </div>
    </StepContainer>
  );
}

function EmergencyContactsStep({ onNext, onPrevious, onSkip }) {
  return (
    <StepContainer
      title="Contatti di Emergenza"
      description="Aggiungi contatti da avvisare in caso di emergenza."
      icon={Heart}
      skippable
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Emergency contact form would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <div className="flex gap-2">
            <Button onClick={onSkip} variant="ghost">Salta</Button>
            <Button onClick={onNext}>Continua</Button>
          </div>
        </div>
      </div>
    </StepContainer>
  );
}

function BankDetailsStep({ onNext, onPrevious, onSkip }) {
  return (
    <StepContainer
      title="Dati Bancari"
      description="Inserisci il tuo IBAN per ricevere le buste paga."
      icon={CreditCard}
      skippable
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Bank details form would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <div className="flex gap-2">
            <Button onClick={onSkip} variant="ghost">Salta</Button>
            <Button onClick={onNext}>Continua</Button>
          </div>
        </div>
      </div>
    </StepContainer>
  );
}

function PreferencesStep({ onNext, onPrevious }) {
  return (
    <StepContainer
      title="Preferenze Notifiche"
      description="Scegli come vuoi ricevere aggiornamenti e notifiche."
      icon={Bell}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Notification preferences would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <Button onClick={onNext}>Continua</Button>
        </div>
      </div>
    </StepContainer>
  );
}

function CompleteStep({ onComplete, userData }) {
  return (
    <StepContainer
      title="Tutto Pronto!"
      description="Hai completato la configurazione. Benvenuto in PulseHR!"
      icon={CheckCircle2}
    >
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Configurazione Completata!</h3>
          <p className="text-sm text-slate-500">Sei pronto per iniziare a utilizzare PulseHR.</p>
        </div>
        <Button onClick={onComplete} size="lg" className="mt-4">
          Vai alla Dashboard
        </Button>
      </div>
    </StepContainer>
  );
}

// Admin Welcome
function AdminWelcomeStep({ onNext, userData }) {
  return (
    <StepContainer
      title={`Benvenuto, ${userData?.firstName || 'Amministratore'}!`}
      description="Configuriamo la tua azienda per iniziare a gestire il team."
      icon={Building2}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            icon={Building2}
            title="Configura Azienda"
            description="Imposta i dati della tua organizzazione"
          />
          <FeatureCard
            icon={Users}
            title="Invita il Team"
            description="Aggiungi e invita i tuoi dipendenti"
          />
          <FeatureCard
            icon={Clock}
            title="Orari di Lavoro"
            description="Definisci gli orari standard"
          />
          <FeatureCard
            icon={DollarSign}
            title="Gestione Buste Paga"
            description="Configura le impostazioni payroll"
          />
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={onNext} size="lg">
            Inizia Configurazione
          </Button>
        </div>
      </div>
    </StepContainer>
  );
}

function CompanyConfirmationStep({ onNext, companyData }) {
  return (
    <StepContainer
      title="Conferma Azienda"
      description="Verifica che i dati della tua azienda siano corretti."
      icon={Building2}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Company details confirmation would go here...</p>
        <div className="flex justify-end pt-4">
          <Button onClick={onNext}>Conferma e Continua</Button>
        </div>
      </div>
    </StepContainer>
  );
}

function CompanyLogoStep({ onNext, onPrevious, onSkip }) {
  return (
    <StepContainer
      title="Logo Aziendale"
      description="Carica il logo della tua azienda per personalizzare l'interfaccia."
      icon={ImageIcon}
      skippable
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Logo upload component would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <div className="flex gap-2">
            <Button onClick={onSkip} variant="ghost">Salta</Button>
            <Button onClick={onNext}>Continua</Button>
          </div>
        </div>
      </div>
    </StepContainer>
  );
}

function WorkScheduleStep({ onNext, onPrevious }) {
  return (
    <StepContainer
      title="Orario di Lavoro"
      description="Configura l'orario di lavoro standard per la tua azienda."
      icon={Clock}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Work schedule configuration would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <Button onClick={onNext}>Continua</Button>
        </div>
      </div>
    </StepContainer>
  );
}

function InviteEmployeesStep({ onNext, onPrevious, onSkip }) {
  return (
    <StepContainer
      title="Invita Dipendenti"
      description="Aggiungi i primi dipendenti e invia loro un invito."
      icon={Users}
      skippable
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Employee invitation form would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <div className="flex gap-2">
            <Button onClick={onSkip} variant="ghost">Salta</Button>
            <Button onClick={onNext}>Continua</Button>
          </div>
        </div>
      </div>
    </StepContainer>
  );
}

function DepartmentsStep({ onNext, onPrevious, onSkip }) {
  return (
    <StepContainer
      title="Configura Reparti"
      description="Organizza la tua azienda creando reparti."
      icon={LayoutGrid}
      skippable
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Departments setup would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <div className="flex gap-2">
            <Button onClick={onSkip} variant="ghost">Salta</Button>
            <Button onClick={onNext}>Continua</Button>
          </div>
        </div>
      </div>
    </StepContainer>
  );
}

function PayrollSettingsStep({ onNext, onPrevious, onSkip }) {
  return (
    <StepContainer
      title="Impostazioni Buste Paga"
      description="Configura le impostazioni per la gestione delle buste paga."
      icon={DollarSign}
      skippable
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Payroll settings would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <div className="flex gap-2">
            <Button onClick={onSkip} variant="ghost">Salta</Button>
            <Button onClick={onNext}>Continua</Button>
          </div>
        </div>
      </div>
    </StepContainer>
  );
}

function AdminCompleteStep({ onComplete }) {
  return (
    <StepContainer
      title="Configurazione Completata!"
      description="La tua azienda è pronta. Inizia a gestire il tuo team."
      icon={CheckCircle2}
    >
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Tutto Pronto!</h3>
          <p className="text-sm text-slate-500">Puoi iniziare a utilizzare PulseHR.</p>
        </div>
        <Button onClick={onComplete} size="lg" className="mt-4">
          Vai alla Dashboard
        </Button>
      </div>
    </StepContainer>
  );
}

// Consultant steps (simplified placeholders)
function ConsultantWelcomeStep({ onNext }) {
  return <WelcomeStep onNext={onNext} userData={{ firstName: "Consulente" }} />;
}

function SpecializationsStep({ onNext, onPrevious }) {
  return (
    <StepContainer title="Specializzazioni" description="Seleziona le tue aree di expertise." icon={Target}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Specializations selection would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <Button onClick={onNext}>Continua</Button>
        </div>
      </div>
    </StepContainer>
  );
}

function ConnectClientsStep({ onNext, onPrevious }) {
  return (
    <StepContainer title="Collega Aziende Clienti" description="Connetti le aziende che gestisci." icon={Link2}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Client connection form would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <Button onClick={onNext}>Continua</Button>
        </div>
      </div>
    </StepContainer>
  );
}

function ImportDataStep({ onNext, onPrevious, onSkip }) {
  return (
    <StepContainer title="Importa Dati Esistenti" description="Importa dati da altri sistemi." icon={Upload} skippable>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Data import interface would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <div className="flex gap-2">
            <Button onClick={onSkip} variant="ghost">Salta</Button>
            <Button onClick={onNext}>Continua</Button>
          </div>
        </div>
      </div>
    </StepContainer>
  );
}

function NotificationPreferencesStep({ onNext, onPrevious }) {
  return <PreferencesStep onNext={onNext} onPrevious={onPrevious} />;
}

function ConsultantCompleteStep({ onComplete }) {
  return <CompleteStep onComplete={onComplete} />;
}

// Platform Admin steps (simplified placeholders)
function PlatformAdminWelcomeStep({ onNext }) {
  return (
    <StepContainer title="Benvenuto, Admin!" description="Configura la piattaforma PulseHR." icon={Settings}>
      <div className="flex justify-end pt-4">
        <Button onClick={onNext} size="lg">Inizia Configurazione</Button>
      </div>
    </StepContainer>
  );
}

function SystemConfigStep({ onNext, onPrevious }) {
  return (
    <StepContainer title="Configurazione Sistema" description="Configura i parametri di sistema." icon={Settings}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">System configuration would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <Button onClick={onNext}>Continua</Button>
        </div>
      </div>
    </StepContainer>
  );
}

function PricingPlansStep({ onNext, onPrevious }) {
  return (
    <StepContainer title="Piani Tariffari" description="Configura i piani di abbonamento." icon={Package}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Pricing plans configuration would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <Button onClick={onNext}>Continua</Button>
        </div>
      </div>
    </StepContainer>
  );
}

function EmailTemplatesStep({ onNext, onPrevious }) {
  return (
    <StepContainer title="Template Email" description="Configura i template email del sistema." icon={Mail}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Email templates editor would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <Button onClick={onNext}>Continua</Button>
        </div>
      </div>
    </StepContainer>
  );
}

function IntegrationsStep({ onNext, onPrevious }) {
  return (
    <StepContainer title="Integrazioni" description="Rivedi e configura le integrazioni." icon={Link2}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Integrations management would go here...</p>
        <div className="flex justify-between pt-4">
          <Button onClick={onPrevious} variant="outline">Indietro</Button>
          <Button onClick={onNext}>Continua</Button>
        </div>
      </div>
    </StepContainer>
  );
}

function PlatformAdminCompleteStep({ onComplete }) {
  return <AdminCompleteStep onComplete={onComplete} />;
}

// ========================================
// HELPER COMPONENTS
// ========================================

function StepContainer({ title, description, icon: Icon, skippable, children }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30">
            <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            {skippable && (
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                Opzionale
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {description}
          </p>
        </div>
      </div>
      
      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        {children}
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30">
          <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            {title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ========================================
// EXPORTS
// ========================================

export default {
  employeeFlow,
  companyAdminFlow,
  consultantFlow,
  platformAdminFlow,
};
