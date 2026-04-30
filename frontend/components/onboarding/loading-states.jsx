"use client";

import { cn } from "@/lib/cn";

/**
 * Loading States Component - PulseHR Design System
 * @component
 * @description Skeleton loaders with shimmer animation for onboarding components
 */

// Shimmer effect for all skeletons
const shimmerClass = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

/**
 * Generic Skeleton Component
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-slate-200 dark:bg-slate-700/50",
        shimmerClass,
        className
      )}
      {...props}
    />
  );
}

/**
 * Card Skeleton for loading cards
 */
export function CardSkeleton({ className }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        
        {/* Footer */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Form Field Skeleton
 */
export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

/**
 * Profile Setup Loading
 */
export function ProfileSetupLoading() {
  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      {/* Form Fields */}
      <div className="space-y-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>
      
      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Company Setup Loading
 */
export function CompanySetupLoading() {
  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-32 w-32 rounded-2xl" />
        <Skeleton className="h-4 w-40" />
      </div>
      
      {/* Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>
      
      {/* Settings */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Employee List Loading
 */
export function EmployeeListLoading({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Department Grid Loading
 */
export function DepartmentGridLoading({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Full Page Loading with Message
 */
export function OnboardingPageLoading({ message = "Caricamento in corso..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="text-center space-y-6">
        {/* Animated Logo or Spinner */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-violet-200 dark:border-violet-900"></div>
            <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-t-violet-600 dark:border-t-violet-400 animate-spin"></div>
          </div>
        </div>
        
        {/* Loading Message */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {message}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Prepariamo tutto per te...
          </p>
        </div>
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-2 w-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-2 w-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Step Loading (between steps)
 */
export function StepTransitionLoading({ stepName }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full border-3 border-t-violet-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Caricamento {stepName}...
        </p>
      </div>
    </div>
  );
}

/**
 * Inline Content Loading
 */
export function InlineLoading({ text = "Caricamento..." }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <div className="h-4 w-4 rounded-full border-2 border-t-violet-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      <span>{text}</span>
    </div>
  );
}

// Export all components
export default {
  Skeleton,
  CardSkeleton,
  FormFieldSkeleton,
  ProfileSetupLoading,
  CompanySetupLoading,
  EmployeeListLoading,
  DepartmentGridLoading,
  OnboardingPageLoading,
  StepTransitionLoading,
  InlineLoading,
};
