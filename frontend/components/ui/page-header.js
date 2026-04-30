import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function PageHeader({
  actions,
  badge,
  description,
  eyebrow,
  title,
  subtitle,
  variant = "default",
  className,
}) {
  return (
    <section className={cn(
      "flex flex-col sm:flex-row sm:items-end justify-between gap-6 py-6 px-6 lg:px-8 mb-2 border-b border-border/50 animate-in fade-in slide-in-from-bottom-2",
      variant === "hero" && "py-12 border-none mb-6",
      className
    )}>
      <div className="flex flex-col space-y-1.5">
        {eyebrow && (
          <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </span>
        )}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={cn(
              "text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading",
              variant === "hero" && "text-3xl sm:text-4xl lg:text-5xl"
            )}>
              {title}
            </h1>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-foreground/80 border border-border/50">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-base sm:text-lg font-medium text-foreground/90">
              {subtitle}
            </p>
          )}
          {description && (
            <p className={cn(
              "text-sm text-muted-foreground max-w-2xl leading-relaxed",
              variant === "hero" && "text-base"
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
      {actions?.length ? (
        <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0 flex-shrink-0">
          {actions.map((action) => (
            action.href ? (
              <a
                className={buttonStyles({ variant: action.variant || "secondary" })}
                href={action.href}
                key={`${action.label}-${action.href}`}
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </a>
            ) : (
              <button
                className={buttonStyles({ variant: action.variant || "secondary" })}
                key={action.label}
                onClick={action.onClick}
                type="button"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </button>
            )
          ))}
        </div>
      ) : null}
    </section>
  );
}
