import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * EmptyState Component
 * 
 * Componente riutilizzabile per stati vuoti con guida all'azione
 * 
 * @param {Object} props
 * @param {React.Component} props.icon - Icona Lucide React
 * @param {string} props.title - Titolo dello stato vuoto
 * @param {string} props.description - Descrizione/guida
 * @param {string} props.action - Testo del bottone azione (opzionale)
 * @param {string} props.href - Link del bottone (opzionale)
 * @param {Function} props.onClick - Handler click bottone (opzionale)
 * @param {string} props.className - Classi CSS aggiuntive
 */
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  href,
  onClick,
  className 
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {/* Icon Container */}
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        {Icon && <Icon className="w-8 h-8 text-muted-foreground" />}
      </div>
      
      {/* Title */}
      <h3 className="font-semibold text-lg text-foreground mb-2">{title}</h3>
      
      {/* Description */}
      <p className="text-muted text-sm mb-4 max-w-md leading-relaxed">{description}</p>
      
      {/* Action Button */}
      {action && (
        <>
          {href ? (
            <Link 
              href={href} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center justify-center gap-2 font-semibold"
            >
              {action}
            </Link>
          ) : onClick ? (
            <button 
              onClick={onClick}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center justify-center gap-2 font-semibold"
            >
              {action}
            </button>
          ) : (
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center justify-center gap-2 font-semibold">
              {action}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default EmptyState;
