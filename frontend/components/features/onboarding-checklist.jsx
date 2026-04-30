"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * OnboardingChecklist - Task-driven onboarding system
 * Guides users through essential setup tasks based on their role
 */

// Role-specific task definitions
const ONBOARDING_TASKS = {
  company: [
    {
      id: "complete_profile",
      title: "Completa il profilo aziendale",
      description: "Aggiungi logo, descrizione e informazioni di contatto",
      priority: "high",
      link: "/company/profile",
      icon: "building",
    },
    {
      id: "add_employee",
      title: "Aggiungi il primo dipendente",
      description: "Registra un dipendente per iniziare",
      priority: "high",
      link: "/employees/new",
      icon: "user-plus",
    },
    {
      id: "configure_location",
      title: "Configura la sede",
      description: "Imposta indirizzo e geolocalizzazione",
      priority: "medium",
      link: "/settings/locations",
      icon: "map-pin",
    },
    {
      id: "invite_consultant",
      title: "Invita un consulente",
      description: "Collega il tuo consulente del lavoro",
      priority: "medium",
      link: "/company/consultants/invite",
      icon: "briefcase",
    },
    {
      id: "first_report",
      title: "Genera il primo report",
      description: "Esporta un report presenze di esempio",
      priority: "low",
      link: "/reports",
      icon: "file-chart",
    },
  ],
  consultant: [
    {
      id: "verify_company",
      title: "Verifica anagrafica azienda",
      description: "Controlla i dati della nuova azienda",
      priority: "high",
      link: "/consultant/companies",
      icon: "building",
    },
    {
      id: "upload_documents",
      title: "Carica documenti iniziali",
      description: "Prepara i documenti necessari",
      priority: "high",
      link: "/consultant/documents",
      icon: "file-up",
    },
    {
      id: "first_review",
      title: "Prima revisione",
      description: "Esegui la revisione iniziale",
      priority: "medium",
      link: "/consultant/reviews",
      icon: "clipboard-check",
    },
    {
      id: "configure_deadlines",
      title: "Configura scadenze",
      description: "Imposta le date limite per l'azienda",
      priority: "medium",
      link: "/consultant/settings",
      icon: "calendar",
    },
    {
      id: "setup_notifications",
      title: "Configura notifiche",
      description: "Attiva gli avvisi per scadenze",
      priority: "low",
      link: "/consultant/notifications",
      icon: "bell",
    },
  ],
  employee: [
    {
      id: "complete_profile",
      title: "Completa il tuo profilo",
      description: "Aggiungi foto e informazioni personali",
      priority: "high",
      link: "/profile",
      icon: "user",
    },
    {
      id: "upload_documents",
      title: "Carica documenti",
      description: "Inserisci documento identità e codice fiscale",
      priority: "high",
      link: "/profile/documents",
      icon: "file-up",
    },
    {
      id: "read_policy",
      title: "Leggi le policy aziendali",
      description: "Familiarizza con regolamento e policy",
      priority: "medium",
      link: "/company/policy",
      icon: "book-open",
    },
    {
      id: "app_tutorial",
      title: "Completa il tutorial",
      description: "Scopri come timbrare e richiedere ferie",
      priority: "low",
      link: "/tutorial",
      icon: "play-circle",
    },
  ],
  admin: [
    {
      id: "verify_system",
      title: "Verifica configurazione sistema",
      description: "Controlla impostazioni generali",
      priority: "high",
      link: "/admin/settings",
      icon: "settings",
    },
    {
      id: "review_companies",
      title: "Revisiona aziende registrate",
      description: "Verifica nuove registrazioni",
      priority: "high",
      link: "/admin/companies",
      icon: "building",
    },
    {
      id: "configure_integrations",
      title: "Configura integrazioni",
      description: "Attiva API e collegamenti esterni",
      priority: "medium",
      link: "/admin/integrations",
      icon: "plug",
    },
  ],
};

// Icon mapping
const ICONS = {
  building: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  "user-plus": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  "map-pin": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  briefcase: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  "file-chart": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  "file-up": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  "clipboard-check": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  bell: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  user: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  "book-open": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  "play-circle": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  settings: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  plug: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

/**
 * Individual task item
 */
function TaskItem({ task, isCompleted, onToggle, isLoading }) {
  const priorityColors = {
    high: "text-danger bg-danger/10",
    medium: "text-warning bg-warning/10",
    low: "text-muted bg-bg-muted",
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-4 p-4 rounded-xl transition-all duration-200",
        isCompleted
          ? "bg-success/5 border border-success/20"
          : "hover:bg-bg-muted/50 border border-transparent hover:border-border"
      )}
    >
      {/* Checkbox / Icon */}
      <button
        onClick={() => onToggle(task.id)}
        disabled={isLoading}
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
          isCompleted
            ? "bg-success text-white"
            : "bg-bg-muted text-muted hover:bg-primary/10 hover:text-primary"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isCompleted ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4
              className={cn(
                "text-sm font-semibold transition-all",
                isCompleted ? "text-muted line-through" : "text-foreground"
              )}
            >
              {task.title}
            </h4>
            <p className="text-xs text-muted mt-0.5">{task.description}</p>
          </div>

          {/* Priority badge */}
          <span
            className={cn(
              "text-[10px] font-medium px-2 py-1 rounded-full capitalize flex-shrink-0",
              priorityColors[task.priority]
            )}
          >
            {task.priority === "high" ? "Priorità" : task.priority}
          </span>
        </div>

        {/* Action link */}
        {!isCompleted && task.link && (
          <a
            href={task.link}
            className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-primary hover:text-primary-strong transition-colors"
          >
            Vai al task
            <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Progress bar component
 */
function ProgressBar({ completed, total }) {
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">Progresso</span>
        <span className="font-semibold text-foreground">{completed}/{total}</span>
      </div>
      <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            percentage === 100 ? "bg-success" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Main OnboardingChecklist component
 */
export function OnboardingChecklist({
  role = "company",
  onTaskComplete,
  initialCompleted = [],
  collapsible = true,
  showProgress = true,
  maxVisible = 5,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [completedTasks, setCompletedTasks] = useState(initialCompleted);
  const [loadingTask, setLoadingTask] = useState(null);

  const tasks = ONBOARDING_TASKS[role] || ONBOARDING_TASKS.company;
  const completedCount = completedTasks.length;
  const totalCount = tasks.length;
  const isAllComplete = completedCount === totalCount;

  // Show "completed" badge if all tasks done
  const showCompletedBadge = isAllComplete && completedCount > 0;

  const handleToggle = async (taskId) => {
    if (loadingTask) return;

    const isCompleting = !completedTasks.includes(taskId);

    if (isCompleting) {
      setLoadingTask(taskId);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newCompleted = [...completedTasks, taskId];
      setCompletedTasks(newCompleted);
      onTaskComplete?.(taskId, newCompleted);
      setLoadingTask(null);
    } else {
      // Allow unchecking
      setLoadingTask(taskId);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setCompletedTasks(completedTasks.filter((id) => id !== taskId));
      setLoadingTask(null);
    }
  };

  const visibleTasks = collapsible ? tasks.slice(0, maxVisible) : tasks;

  return (
    <Card className={cn("border-border/50", showCompletedBadge && "bg-success/5")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                showCompletedBadge ? "bg-success text-white" : "bg-primary/10 text-primary"
              )}
            >
              {showCompletedBadge ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">
                {showCompletedBadge ? "Setup Completato!" : "Setup Iniziale"}
              </CardTitle>
              <p className="text-xs text-muted">
                {showCompletedBadge
                  ? "Tutti i task sono stati completati"
                  : `${completedCount} di ${totalCount} task completati`}
              </p>
            </div>
          </div>

          {/* Collapse toggle */}
          {collapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-bg-muted transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted" />
              )}
            </button>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="mt-4">
            <ProgressBar completed={completedCount} total={totalCount} />
          </div>
        )}
      </CardHeader>

      {/* Task list */}
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {visibleTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isCompleted={completedTasks.includes(task.id)}
                onToggle={handleToggle}
                isLoading={loadingTask === task.id}
              />
            ))}
          </div>

          {/* Show more button */}
          {collapsible && tasks.length > maxVisible && (
            <button className="w-full mt-4 py-2 text-sm font-medium text-primary hover:text-primary-strong transition-colors">
              Vedi tuttii {tasks.length} task
            </button>
          )}

          {/* Completion celebration */}
          {showCompletedBadge && (
            <div className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20 text-center">
              <p className="text-sm font-medium text-success">
                Ottimo lavoro! La configurazione iniziale è completa.
              </p>
              <p className="text-xs text-muted mt-1">
                Ora puoi iniziare a usare tutte le funzionalità di Pulse.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default OnboardingChecklist;
