import { cn } from "@/lib/cn";

const CLASS_MAP = {
  "status-badge-success": "border-green-500/20 bg-green-500/10 text-green-600 dark:border-green-500/30 dark:text-green-400",
  "status-badge-warning": "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/30 dark:text-amber-400",
  "status-badge-danger": "border-red-500/20 bg-red-500/10 text-red-600 dark:border-red-500/30 dark:text-red-400",
  "status-badge-info": "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:border-blue-500/30 dark:text-blue-400",
  "status-badge-muted": "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:border-slate-500/30 dark:text-slate-400",
};

const STATUS_CLASS_MAP = {
  active: CLASS_MAP["status-badge-success"],
  suspended: CLASS_MAP["status-badge-warning"],
  inactive: CLASS_MAP["status-badge-muted"],
  trial: CLASS_MAP["status-badge-info"],
  cancelled: CLASS_MAP["status-badge-danger"],
  pending: CLASS_MAP["status-badge-warning"],
  pending_company: CLASS_MAP["status-badge-warning"],
  pending_consultant: CLASS_MAP["status-badge-info"],
  rejected: CLASS_MAP["status-badge-danger"],
  draft: CLASS_MAP["status-badge-muted"],
  waiting_documents: CLASS_MAP["status-badge-warning"],
  in_progress: CLASS_MAP["status-badge-info"],
  ready_for_review: CLASS_MAP["status-badge-info"],
  approved_by_company: CLASS_MAP["status-badge-success"],
  delivered_to_employee: CLASS_MAP["status-badge-success"],
  correction_requested: CLASS_MAP["status-badge-warning"],
  archived: CLASS_MAP["status-badge-muted"],
  review_needed: CLASS_MAP["status-badge-warning"],
  approved: CLASS_MAP["status-badge-success"],
  corrected: CLASS_MAP["status-badge-info"],
  open: CLASS_MAP["status-badge-muted"],
  in_review: CLASS_MAP["status-badge-info"],
  closed: CLASS_MAP["status-badge-warning"],
  exported: CLASS_MAP["status-badge-info"],
  working: CLASS_MAP["status-badge-success"],
  on_break: CLASS_MAP["status-badge-warning"],
  finished: CLASS_MAP["status-badge-info"],
  not_started: CLASS_MAP["status-badge-muted"],
  success: CLASS_MAP["status-badge-success"],
  warning: CLASS_MAP["status-badge-warning"],
  danger: CLASS_MAP["status-badge-danger"],
  info: CLASS_MAP["status-badge-info"],
  neutral: CLASS_MAP["status-badge-muted"],
  company_only: CLASS_MAP["status-badge-info"],
  consultant_only: CLASS_MAP["status-badge-info"],
  company_and_consultant: CLASS_MAP["status-badge-info"],
  employee_only: CLASS_MAP["status-badge-warning"],
  employee_and_company: CLASS_MAP["status-badge-success"],
  employee_company_consultant: CLASS_MAP["status-badge-success"],
};

function humanizeLabel(label) {
  if (typeof label !== "string") {
    return label;
  }

  if (label !== label.toLowerCase()) {
    return label;
  }

  return label
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function StatusBadge({ className, label, status = "neutral" }) {
  return (
    <span 
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap", 
        STATUS_CLASS_MAP[status] || STATUS_CLASS_MAP.neutral, 
        className
      )}
    >
      {humanizeLabel(label)}
    </span>
  );
}
