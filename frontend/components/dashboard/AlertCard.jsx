'use client';

import { cn } from '@/lib/cn';

export function AlertCard({ 
  title, 
  message,
  type = 'info',
  action,
  onDismiss
}) {
  const typeClasses = {
    info: {
      container: 'bg-info/10 border-info/30',
      icon: 'text-info',
      iconBg: 'bg-info/20',
    },
    warning: {
      container: 'bg-warning/10 border-warning/30',
      icon: 'text-warning',
      iconBg: 'bg-warning/20',
    },
    error: {
      container: 'bg-danger/10 border-danger/30',
      icon: 'text-danger',
      iconBg: 'bg-danger/20',
    },
    success: {
      container: 'bg-success/10 border-success/30',
      icon: 'text-success',
      iconBg: 'bg-success/20',
    },
  };

  const icons = {
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={cn(
      "border rounded-xl p-4",
      typeClasses[type].container
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", typeClasses[type].iconBg)}>
          <div className={typeClasses[type].icon}>
            {icons[type]}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          {title && <h4 className="font-semibold text-foreground">{title}</h4>}
          {message && <p className="text-sm text-muted mt-1">{message}</p>}
          
          {action && (
            <button 
              onClick={action.onClick}
              className="mt-3 text-sm font-medium text-primary hover:text-primary/80"
            >
              {action.label}
            </button>
          )}
        </div>
        
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="text-muted hover:text-foreground"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
