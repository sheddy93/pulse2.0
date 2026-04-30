'use client';

import { cn } from '@/lib/cn';

export function ActivityCard({ items = [] }) {
  if (!items.length) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-soft p-6">
        <h3 className="text-lg font-semibold mb-4">Attivita Recente</h3>
        <p className="text-sm text-muted text-center py-8">Nessuna attivita recente</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-soft p-6">
      <h3 className="text-lg font-semibold mb-4">Attivita Recente</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            {/* Indicator */}
            <div className={cn(
              "w-2 h-2 rounded-full mt-2 flex-shrink-0",
              item.type === 'success' && "bg-success",
              item.type === 'warning' && "bg-warning",
              item.type === 'error' && "bg-danger",
              item.type === 'info' && "bg-info",
              !item.type && "bg-primary"
            )} />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.description && (
                <p className="text-xs text-muted mt-0.5">{item.description}</p>
              )}
              {item.time && (
                <p className="text-xs text-muted mt-1">{item.time}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
