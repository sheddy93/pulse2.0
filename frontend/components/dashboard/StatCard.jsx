'use client';

import { cn } from '@/lib/cn';

export function StatCard({ 
  label, 
  value, 
  icon: Icon,
  progress,
  progressLabel
}) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-soft p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3>
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full h-1 bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          {progressLabel && (
            <p className="text-xs text-muted mt-1">{progressLabel}</p>
          )}
        </div>
      )}
    </div>
  );
}
