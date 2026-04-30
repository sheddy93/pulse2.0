"use client";

import { X, Download, FileText } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function DocumentViewer({ url, title, isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !url) {
    return null;
  }

  const isPdf = url.toLowerCase().includes(".pdf");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in p-4 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-label={title || "Document Viewer"}
        aria-modal="true"
        className="relative w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl animate-in zoom-in-95"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold leading-none tracking-tight">
                {title || "Documento"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Anteprima sicura in-app</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                window.open(url, "_blank");
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Scarica originale</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-muted/10 relative">
          {isPdf ? (
            <iframe
              src={`${url}#toolbar=0&navpanes=0`}
              className="w-full h-full border-0"
              title={title}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-8">
              <img
                src={url}
                alt={title}
                className="max-h-full max-w-full object-contain rounded border shadow-sm bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
