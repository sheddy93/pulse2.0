'use client';

import { cn } from '@/lib/cn';

export function KpiCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendDirection = 'up',
  icon: Icon,
  accentColor = 'primary'
}) {
  const accentClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
    info: 'text-info bg-info/10',
  };

  const trendClasses = {
    up: 'text-success',
    down: 'text-danger',
    neutral: 'text-muted',
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-soft p-5 relative overflow-hidden">
      {/* Background accent */}
      <div className={cn(
        "absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10",
        accentColor === 'primary' && "bg-primary",
        accentColor === 'success' && "bg-success",
        accentColor === 'warning' && "bg-warning",
        accentColor === 'danger' && "bg-danger",
        accentColor === 'info' && "bg-info",
      )} />
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
          {subtitle && (
            <p className="text-xs text-muted mt-2">{subtitle}</p>
          )}
        </div>
        
        {Icon && (
          <div className={cn("p-3 rounded-xl", accentClasses[accentColor])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      {trend && (
        <div className={cn("flex items-center gap-1 mt-3 text-xs font-medium", trendClasses[trendDirection])}>
          {trendDirection === 'up' ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : trendDirection === 'down' ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          ) : null}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
