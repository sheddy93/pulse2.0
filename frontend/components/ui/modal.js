"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function Modal({ children, onClose, open, title }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-label={title}
        aria-modal="true"
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-lg animate-in zoom-in-95 fade-in-0"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detail view</p>
            <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
          </div>
          <button
            aria-label="Close modal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
