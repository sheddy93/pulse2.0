import { cn } from '@/lib/cn';

/**
 * LoadingSkeleton Component
 * 
 * Componente riutilizzabile per stati di caricamento
 * 
 * @param {Object} props
 * @param {string} props.variant - Tipo di skeleton: 'default' | 'card' | 'table' | 'list'
 * @param {number} props.count - Numero di elementi skeleton (per list/table)
 * @param {string} props.className - Classi CSS aggiuntive
 */
export function LoadingSkeleton({ variant = 'default', count = 3, className }) {
  if (variant === 'card') {
    return (
      <div className={cn("space-y-4 animate-pulse", className)}>
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="h-32 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn("space-y-3 animate-pulse", className)}>
        {/* Header */}
        <div className="flex gap-4">
          <div className="h-4 bg-muted rounded flex-1" />
          <div className="h-4 bg-muted rounded flex-1" />
          <div className="h-4 bg-muted rounded flex-1" />
          <div className="h-4 bg-muted rounded w-24" />
        </div>
        {/* Rows */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-10 bg-muted rounded flex-1" />
            <div className="h-10 bg-muted rounded flex-1" />
            <div className="h-10 bg-muted rounded flex-1" />
            <div className="h-10 bg-muted rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn("space-y-3 animate-pulse", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default skeleton
  return (
    <div className={cn("space-y-4 animate-pulse", className)}>
      <div className="h-8 bg-muted rounded w-1/4" />
      <div className="h-32 bg-muted rounded" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-24 bg-muted rounded" />
        <div className="h-24 bg-muted rounded" />
        <div className="h-24 bg-muted rounded" />
      </div>
    </div>
  );
}

/**
 * SkeletonText - Simple text skeleton
 */
export function SkeletonText({ className, width = '100%' }) {
  return (
    <div 
      className={cn("h-4 bg-muted rounded animate-pulse", className)}
      style={{ width }}
    />
  );
}

/**
 * SkeletonCircle - Circle skeleton (for avatars)
 */
export function SkeletonCircle({ size = 'md', className }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div 
      className={cn(
        "bg-muted rounded-full animate-pulse flex-shrink-0",
        sizeClasses[size],
        className
      )}
    />
  );
}

/**
 * SkeletonCard - Card skeleton
 */
export function SkeletonCard({ className }) {
  return (
    <div className={cn("p-6 rounded-lg border border-border space-y-4 animate-pulse", className)}>
      <div className="flex items-center justify-between">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-6 bg-muted rounded w-12" />
      </div>
      <div className="h-32 bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-10 bg-muted rounded flex-1" />
        <div className="h-10 bg-muted rounded flex-1" />
      </div>
    </div>
  );
}

export default LoadingSkeleton;
