"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Professional card container for auth forms
 * - Glass-morphism style with backdrop blur
 * - Rounded corners with subtle shadow
 * - Contains header, form slot, and footer
 */
export function AuthCard({ children, className }) {
  return (
    <div
      className={cn(
        "w-full bg-glass border border-glass-border backdrop-blur-[14px]",
        "rounded-xl shadow-xl",
        "overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Header section of the auth card
 */
export function AuthCardHeader({ children, className }) {
  return (
    <div className={cn("px-6 py-5 sm:px-8 sm:py-6", className)}>
      {children}
    </div>
  );
}

/**
 * Title for the auth card
 */
export function AuthCardTitle({ children, className }) {
  return (
    <h2
      className={cn(
        "text-2xl sm:text-3xl font-bold tracking-tight text-foreground",
        className
      )}
    >
      {children}
    </h2>
  );
}

/**
 * Description/subtitle for the auth card
 */
export function AuthCardDescription({ children, className }) {
  return (
    <p className={cn("mt-2 text-sm sm:text-base text-muted", className)}>
      {children}
    </p>
  );
}

/**
 * Content/form section of the auth card
 */
export function AuthCardContent({ children, className }) {
  return (
    <div className={cn("px-6 pb-6 sm:px-8 sm:pb-8", className)}>
      {children}
    </div>
  );
}

/**
 * Footer section of the auth card
 */
export function AuthCardFooter({ children, className }) {
  return (
    <div
      className={cn(
        "px-6 py-4 sm:px-8 sm:py-5 bg-bg-muted/30 border-t border-border/50",
        className
      )}
    >
      {children}
    </div>
  );
}
