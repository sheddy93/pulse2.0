import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * ErrorState Component
 * 
 * Componente riutilizzabile per stati di errore con retry
 * 
 * @param {Object} props
 * @param {string} props.title - Titolo errore (default: "Qualcosa è andato storto")
 * @param {string} props.message - Messaggio errore dettagliato
 * @param {Function} props.onRetry - Handler per retry (opzionale)
 * @param {Function} props.onGoHome - Handler per tornare home (opzionale)
 * @param {string} props.variant - Tipo errore: 'danger' | 'warning' | 'info'
 * @param {string} props.className - Classi CSS aggiuntive
 */
export function ErrorState({ 
  title = "Qualcosa è andato storto",
  message, 
  onRetry, 
  onGoHome,
  variant = 'danger',
  className 
}) {
  const variantStyles = {
    danger: {
      iconBg: 'bg-danger/10',
      iconColor: 'text-danger',
      title: 'text-danger'
    },
    warning: {
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      title: 'text-warning'
    },
    info: {
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
      title: 'text-info'
    }
  };

  const styles = variantStyles[variant] || variantStyles.danger;

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {/* Error Icon */}
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center mb-4",
        styles.iconBg
      )}>
        <AlertCircle className={cn("w-8 h-8", styles.iconColor)} />
      </div>
      
      {/* Title */}
      <h3 className={cn("font-semibold text-lg mb-2", styles.title)}>
        {title}
      </h3>
      
      {/* Message */}
      {message && (
        <p className="text-muted text-sm mb-6 max-w-md leading-relaxed">
          {message}
        </p>
      )}
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center justify-center gap-2 font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Riprova
          </button>
        )}
        {onGoHome && (
          <button 
            onClick={onGoHome}
            className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Torna alla Home
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ErrorBanner - Inline error banner
 */
export function ErrorBanner({ 
  message, 
  onDismiss,
  variant = 'danger',
  className 
}) {
  const variantStyles = {
    danger: 'bg-danger/10 border-danger/30 text-danger',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    info: 'bg-info/10 border-info/30 text-info'
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-lg border",
      variantStyles[variant],
      className
    )}>
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-sm font-medium hover:underline"
        >
          Chiudi
        </button>
      )}
    </div>
  );
}

/**
 * ErrorCard - Error in card format
 */
export function ErrorCard({ 
  title = "Errore di caricamento",
  message, 
  onRetry,
  className 
}) {
  return (
    <div className={cn(
      "p-6 rounded-lg border border-danger/30 bg-danger/5",
      className
    )}>
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-danger/10">
          <AlertCircle className="w-5 h-5 text-danger" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          {message && (
            <p className="text-sm text-muted mb-3">{message}</p>
          )}
          {onRetry && (
            <button 
              onClick={onRetry}
              className="px-3 py-1.5 text-sm bg-danger text-white hover:bg-danger/90 rounded-lg inline-flex items-center justify-center gap-2 font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              Riprova
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
