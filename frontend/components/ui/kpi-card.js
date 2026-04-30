import { cn } from "@/lib/cn";

const ACCENT_STYLES = {
  primary: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/20",
  success: "text-green-500 bg-green-500/10 dark:bg-green-500/20",
  warning: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20",
  danger: "text-red-500 bg-red-500/10 dark:bg-red-500/20",
  info: "text-sky-500 bg-sky-500/10 dark:bg-sky-500/20",
};

export function KpiCard({ accent = "primary", detail, icon: Icon, title, value, valueSuffix }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-gradient-to-b from-card to-muted/50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <strong className="block font-heading text-3xl tracking-tight">
            {value}
            {valueSuffix ? <span className="ml-1.5 text-sm font-semibold text-muted-foreground">{valueSuffix}</span> : null}
          </strong>
        </div>
        {Icon ? (
          <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl", ACCENT_STYLES[accent])}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {detail ? <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p> : null}
    </article>
  );
}
