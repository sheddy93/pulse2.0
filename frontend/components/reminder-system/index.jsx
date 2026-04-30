'use client';

import { Bell, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Badge per reminder singolo
 */
export function ReminderBadge({ type = 'info', title, time, onClick }) {
  const config = {
    info: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20', icon: Bell },
    warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', icon: AlertCircle },
    success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', icon: CheckCircle },
    danger: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20', icon: AlertCircle },
  };
  
  const { bg, text, border, icon: Icon } = config[type] || config.info;
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
        bg, border, "hover:bg-opacity-20"
      )}
    >
      <Icon className={cn("w-4 h-4", text)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        {time && <p className="text-xs text-muted">{time}</p>}
      </div>
    </div>
  );
}

/**
 * Campanella con badge count
 */
export function ReminderBell({ count = 0, onClick, className }) {
  return (
    <button 
      onClick={onClick}
      className={cn("relative p-2 rounded-lg hover:bg-gray-800 transition-colors", className)}
    >
      <Bell className="w-5 h-5 text-muted" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center font-medium">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

/**
 * Sistema completo reminder con lista e azioni
 */
export function ReminderSystem({ 
  reminders = [], 
  onDismiss,
  onAction,
  maxDisplay = 5,
  className 
}) {
  const displayReminders = reminders.slice(0, maxDisplay);
  
  const getTypeConfig = (type) => {
    switch (type) {
      case 'leave_request': return { bg: 'bg-info/10', text: 'text-info', icon: Clock };
      case 'document_expiring': return { bg: 'bg-warning/10', text: 'text-warning', icon: FileText };
      case 'task_overdue': return { bg: 'bg-danger/10', text: 'text-danger', icon: AlertCircle };
      case 'attendance': return { bg: 'bg-success/10', text: 'text-success', icon: CheckCircle };
      default: return { bg: 'bg-gray-800', text: 'text-muted', icon: Bell };
    }
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      {displayReminders.length === 0 ? (
        <p className="text-sm text-muted text-center py-4">Nessun reminder</p>
      ) : (
        displayReminders.map((reminder, index) => {
          const config = getTypeConfig(reminder.type);
          const Icon = config.icon;
          
          return (
            <div key={reminder.id || index} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-gray-800">
              <div className={cn("p-2 rounded-lg", config.bg)}>
                <Icon className={cn("w-4 h-4", config.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{reminder.title}</p>
                {reminder.description && (
                  <p className="text-xs text-muted mt-0.5 truncate">{reminder.description}</p>
                )}
              </div>
              {onAction && (
                <div className="flex gap-1">
                  {reminder.action && (
                    <button 
                      onClick={() => onAction(reminder)}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20"
                    >
                      {reminder.action}
                    </button>
                  )}
                  {onDismiss && (
                    <button 
                      onClick={() => onDismiss(reminder.id)}
                      className="text-xs px-2 py-1 bg-gray-800 text-muted rounded hover:bg-gray-700"
                    >
                      X
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// Default export for the ReminderSystem component
export default ReminderSystem;
