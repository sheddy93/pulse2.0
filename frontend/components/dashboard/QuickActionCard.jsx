'use client';

import { cn } from '@/lib/cn';
import Link from 'next/link';

export function QuickActionCard({ 
  title, 
  description,
  icon: Icon, 
  href,
  onClick,
  variant = 'default'
}) {
  const variantClasses = {
    default: 'hover:border-primary/50 hover:bg-primary/5',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    success: 'bg-success text-success-foreground hover:bg-success/90',
  };

  const content = (
    <div className={cn(
      "card p-5 cursor-pointer transition-all duration-150",
      variant === 'default' && variantClasses.default,
      variant !== 'default' && variantClasses[variant]
    )}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={cn(
            "p-3 rounded-xl",
            variant === 'default' ? "bg-primary/10 text-primary" : "bg-white/20"
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1">
          <h4 className={cn(
            "font-semibold",
            variant === 'default' ? "text-foreground" : "text-white"
          )}>
            {title}
          </h4>
          {description && (
            <p className={cn(
              "text-sm mt-0.5",
              variant === 'default' ? "text-muted" : "text-white/80"
            )}>
              {description}
            </p>
          )}
        </div>
        {variant === 'default' && (
          <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return content;
}
