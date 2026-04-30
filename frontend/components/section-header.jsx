"use client";

import { cn } from "@/lib/cn";

export function SectionHeader({ title, description, children, className }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4", className)}>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}

export default SectionHeader;