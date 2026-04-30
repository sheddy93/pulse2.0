"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

const BadgeVariants = {
  default: "bg-primary text-primary-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent-soft text-accent",
  muted: "bg-bg-muted text-muted",
};

const dotColors = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  secondary: "bg-secondary",
  accent: "bg-accent",
  muted: "bg-muted",
  default: "bg-primary",
};

export function Badge({ 
  children, 
  variant = "default", 
  className,
  dot = false,
  ...props 
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        BadgeVariants[variant] || BadgeVariants.default,
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          "h-1.5 w-1.5 rounded-full",
          dotColors[variant] || dotColors.default,
        )} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ label, status }) {
  const variants = {
    success: { text: "text-success", dot: "bg-success" },
    warning: { text: "text-warning", dot: "bg-warning" },
    danger: { text: "text-danger", dot: "bg-danger" },
    info: { text: "text-info", dot: "bg-info" },
    neutral: { text: "text-muted", dot: "bg-muted" },
  };
  
  const style = variants[status] || variants.neutral;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
      style.text
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {label}
    </span>
  );
}

export function KpiBadge({ value, label, trend }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 shadow-soft">
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted">{label}</span>
      {trend && (
        <span className={cn(
          "text-xs font-medium",
          trend > 0 ? "text-success" : "text-danger"
        )}>
          {trend > 0 ? "+" : "-"} {Math.abs(trend)}%
        </span>
      )}
    </div>
  );
}
