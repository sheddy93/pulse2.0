"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  BellOff,
  Calendar,
  Clock,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Settings,
  X,
  Mail,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/**
 * ReminderSystem - Automated notification system
 * Provides contextual reminders based on user role and time
 */

// Reminder types
const REMINDER_TYPES = {
  DOCUMENT_EXPIRY: {
    id: "document_expiry",
    title: "Documento in scadenza",
    icon: FileText,
    color: "warning",
    urgency: "high",
    defaultTiming: 3, // days before
  },
  LEAVE_PENDING: {
    id: "leave_pending",
    title: "Richiesta ferie",
    icon: Calendar,
    color: "info",
    urgency: "medium",
    defaultTiming: 7,
  },
  CHECKIN_REMINDER: {
    id: "checkin_reminder",
    title: "Ricorda check-in",
    icon: Clock,
    color: "primary",
    urgency: "low",
    defaultTiming: 0,
  },
  WEEKLY_SUMMARY: {
    id: "weekly_summary",
    title: "Riepilogo settimanale",
    icon: Bell,
    color: "success",
    urgency: "low",
    defaultTiming: 0,
  },
  PAYROLL_REVIEW: {
    id: "payroll_review",
    title: "Revisione cedolini",
    icon: Users,
    color: "warning",
    urgency: "high",
    defaultTiming: 5,
  },
  DEADLINE_APPROACHING: {
    id: "deadline_approaching",
    title: "Scadenza imminente",
    icon: AlertTriangle,
    color: "danger",
    urgency: "high",
    defaultTiming: 1,
  },
};

// Sample reminder data (mock)
const MOCK_REMINDERS = [
  {
    id: "rem_1",
    type: "document_expiry",
    title: "Contratto di Marco Bianchi",
    description: "Scade tra 3 giorni",
    company: "TechnoSoft S.r.l.",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "rem_2",
    type: "leave_pending",
    title: "Richiesta ferie - Andrea Nero",
    description: "25/04/2026 - 02/05/2026",
    company: "TechnoSoft S.r.l.",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "rem_3",
    type: "payroll_review",
    title: "Cedolini Aprile",
    description: "Da revisionare entro il 28",
    company: "LogiNet Italia S.p.A.",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: "rem_4",
    type: "deadline_approaching",
    title: "Dichiarazione INPS",
    description: "Scadenza domani!",
    company: "RetailPro S.p.A.",
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
];

// Reminder settings
const DEFAULT_SETTINGS = {
  documentExpiry: { enabled: true, daysBefore: 3, channels: ["in_app", "email"] },
  leavePending: { enabled: true, daysBefore: 7, channels: ["in_app"] },
  checkinReminder: { enabled: true, time: "08:30", channels: ["in_app"] },
  weeklySummary: { enabled: true, day: "friday", time: "17:00", channels: ["in_app", "email"] },
  payrollReview: { enabled: true, daysBefore: 5, channels: ["in_app", "email"] },
};

/**
 * Individual reminder card
 */
function ReminderCard({ reminder, onDismiss, onAction }) {
  const typeConfig = REMINDER_TYPES[reminder.type] || REMINDER_TYPES.DOCUMENT_EXPIRY;
  const Icon = typeConfig.icon;
  
  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    success: "bg-success/10 text-success border-success/20",
    info: "bg-info/10 text-info border-info/20",
  };

  const iconBg = {
    primary: "bg-primary",
    warning: "bg-warning",
    danger: "bg-danger",
    success: "bg-success",
    info: "bg-info",
  };

  // Calculate time remaining
  const getTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Scaduto";
    if (diffDays === 0) return "Oggi";
    if (diffDays === 1) return "Domani";
    if (diffDays <= 7) return `Tra ${diffDays} giorni`;
    return due.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
        "hover:shadow-md",
        reminder.read 
          ? "bg-surface border-border" 
          : "bg-primary/5 border-primary/20",
        colorClasses[typeConfig.color].split(" ").slice(0, 2).join(" ")
      )}
    >
      {/* Unread indicator */}
      {!reminder.read && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}

      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        reminder.read ? "bg-bg-muted text-muted" : iconBg[typeConfig.color]
      )}>
        {reminder.read ? (
          <Icon className="w-5 h-5 text-muted" />
        ) : (
          <Icon className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className={cn(
              "text-sm font-semibold",
              reminder.read ? "text-muted" : "text-foreground"
            )}>
              {reminder.title}
            </h4>
            <p className="text-xs text-muted mt-0.5">{reminder.description}</p>
            {reminder.company && (
              <p className="text-xs text-muted/70 mt-1">{reminder.company}</p>
            )}
          </div>

          {/* Time badge */}
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full flex-shrink-0",
            reminder.read ? "bg-bg-muted text-muted" : colorClasses[typeConfig.color]
          )}>
            {getTimeRemaining(reminder.dueDate)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => onAction?.(reminder)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
              reminder.read 
                ? "text-primary hover:bg-primary/10" 
                : "bg-primary text-white hover:bg-primary-strong"
            )}
          >
            {typeConfig.id.includes("leave") ? "Approva" : "Vedi"}
            <ChevronRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDismiss?.(reminder.id)}
            className="text-xs text-muted hover:text-danger transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Reminder badge counter
 */
export function ReminderBadge({ count, className }) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-danger text-white",
        "text-[10px] font-bold flex items-center justify-center px-1",
        "animate-in fade-in zoom-in duration-200",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * Reminder bell icon with badge
 */
export function ReminderBell({ count = 0, onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-lg hover:bg-bg-muted transition-colors",
        className
      )}
    >
      <Bell className="w-5 h-5 text-muted" />
      <ReminderBadge count={count} />
    </button>
  );
}

/**
 * Reminder notification dropdown
 */
export function ReminderDropdown({ 
  reminders = MOCK_REMINDERS, 
  onDismiss, 
  onAction,
  onSettingsClick,
  className 
}) {
  const [activeTab, setActiveTab] = useState("all");
  
  const unreadCount = reminders.filter(r => !r.read).length;
  
  const filteredReminders = reminders.filter(r => {
    if (activeTab === "unread") return !r.read;
    if (activeTab === "urgent") {
      const type = REMINDER_TYPES[r.type];
      return type?.urgency === "high";
    }
    return true;
  });

  const tabs = [
    { id: "all", label: "Tutti", count: reminders.length },
    { id: "unread", label: "Non letti", count: unreadCount },
    { id: "urgent", label: "Urgenti", count: reminders.filter(r => REMINDER_TYPES[r.type]?.urgency === "high" && !r.read).length },
  ];

  return (
    <Card className={cn("w-96 shadow-xl border-border/50 overflow-hidden", className)}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notifiche
            </CardTitle>
            {unreadCount > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {unreadCount} nuove
              </span>
            )}
          </div>
          <button
            onClick={onSettingsClick}
            className="p-1.5 rounded-lg hover:bg-bg-muted transition-colors"
          >
            <Settings className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-3 -mx-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-bg-muted"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "ml-1",
                  activeTab === tab.id ? "text-primary" : "text-muted"
                )}>
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>

      {/* Reminder list */}
      <CardContent className="p-0 max-h-[400px] overflow-y-auto">
        {filteredReminders.length === 0 ? (
          <div className="text-center py-8">
            <BellOff className="w-10 h-10 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">Nessuna notifica</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredReminders.map(reminder => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onDismiss={onDismiss}
                onAction={onAction}
              />
            ))}
</div>
        )}
      </CardContent>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-bg-muted/30">
        <button className="w-full text-center text-xs text-primary hover:text-primary-strong font-medium">
          Vedi tutte le notifiche
        </button>
      </div>
    </Card>
  );
}

/**
 * Reminder settings panel
 */
export function ReminderSettings({ settings = DEFAULT_SETTINGS, onSave }) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleToggle = (key) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled }
    }));
  };

  const handleChannelToggle = (key, channel) => {
    setLocalSettings(prev => {
      const currentChannels = prev[key].channels || [];
      const newChannels = currentChannels.includes(channel)
        ? currentChannels.filter(c => c !== channel)
        : [...currentChannels, channel];
      return {
        ...prev,
        [key]: { ...prev[key], channels: newChannels }
      };
    });
  };

  const reminderSettingsList = [
    {
      key: "documentExpiry",
      title: "Scadenza documenti",
      description: "Notifica 3 giorni prima della scadenza",
      icon: FileText,
    },
    {
      key: "leavePending",
      title: "Richieste ferie",
      description: "Notifica per richieste in approvazione",
      icon: Calendar,
    },
    {
      key: "checkinReminder",
      title: "Promemoria check-in",
      description: "Ricorda di timbrare ogni mattina",
      icon: Clock,
    },
    {
      key: "weeklySummary",
      title: "Riepilogo settimanale",
      description: "Report attività ogni venerdì",
      icon: Bell,
    },
    {
      key: "payrollReview",
      title: "Revisione cedolini",
      description: "Notifica per revisione buste paga",
      icon: Users,
    },
  ];

  const channels = [
    { id: "in_app", label: "In-app", icon: Bell },
    { id: "email", label: "Email", icon: Mail },
    { id: "push", label: "Push", icon: Smartphone },
  ];

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Impostazioni Notifiche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reminderSettingsList.map(setting => (
          <div 
            key={setting.key}
            className="flex items-start gap-4 p-4 rounded-xl bg-bg-muted/30 border border-border"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <setting.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">{setting.title}</h4>
                <button
                  onClick={() => handleToggle(setting.key)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    localSettings[setting.key]?.enabled ? "bg-primary" : "bg-border"
                  )}
                >
                  <span 
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      localSettings[setting.key]?.enabled ? "left-6" : "left-1"
                    )}
                  />
                </button>
              </div>
              <p className="text-xs text-muted mt-1">{setting.description}</p>
              
              {/* Channel selection */}
              {localSettings[setting.key]?.enabled && (
                <div className="flex items-center gap-2 mt-3">
                  {channels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelToggle(setting.key, channel.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                        localSettings[setting.key]?.channels?.includes(channel.id)
                          ? "bg-primary/10 text-primary"
                          : "bg-bg-muted text-muted hover:bg-border"
                      )}
                    >
                      <channel.icon className="w-3 h-3" />
                      {channel.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-3 pt-4">
          <button className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent inline-flex items-center justify-center gap-2">
            Annulla
          </button>
          <button 
            onClick={() => onSave?.(localSettings)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center justify-center gap-2 font-semibold"
          >
            Salva impostazioni
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Weekly summary card component
 */
export function WeeklySummaryCard({ data, className }) {
  const dayLabels = ["Lun", "Mar", "Mer", "Gio", "Ven"];
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-success" />
            Riepilogo Settimana
          </CardTitle>
          <span className="text-xs text-muted">22-26 Apr</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {dayLabels.map((day, i) => (
            <div key={day} className="text-center">
              <div className={cn(
                "w-full aspect-square rounded-lg flex items-center justify-center mb-1",
                data?.[i]?.worked 
                  ? "bg-success/10 text-success" 
                  : "bg-bg-muted text-muted"
              )}>
                {data?.[i]?.worked ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className="text-xs font-medium">{day}</span>
                )}
              </div>
              <span className="text-[10px] text-muted">{day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ReminderDropdown;
