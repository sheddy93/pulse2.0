"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

/**
 * Tabs Component - PulseHR Design System
 * @component
 * @description Tabbed interface component built on Radix UI Tabs with elegant underline style
 *
 * @example
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 */
const Tabs = TabsPrimitive.Root;

/**
 * TabsList Component
 * @component
 * @description Container for tab triggers with animated indicator
 */
const TabsList = React.forwardRef(({ className, children, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "relative inline-flex items-center",
      "bg-slate-100 dark:bg-slate-800/50",
      "p-1 rounded-[14px]",
      className
    )}
    {...props}
  >
    {/* Animated underline indicator */}
    <div
      className={cn(
        "absolute bottom-1 h-[calc(100%-8px)]",
        "bg-white dark:bg-slate-900",
        "rounded-[10px]",
        "shadow-sm",
        "transition-all duration-300 ease-out",
        "before:absolute before:inset-0",
        "before:rounded-[10px] before:ring-1 before:ring-black/5",
        "dark:before:ring-white/10"
      )}
      style={{ width: "var(--radix-tabs-trigger-width)", left: "var(--radix-tabs-trigger-left)" }}
    />
    {children}
  </TabsPrimitive.List>
));
TabsList.displayName = "TabsList";

/**
 * TabsTrigger Component
 * @component
 * @description Individual tab trigger button with optional icon support
 *
 * @param {Object} props
 * @param {string} props.value - The value that identifies this tab
 * @param {React.ReactNode} [props.icon] - Optional icon to display before the text
 * @param {boolean} [props.disabled] - Whether the tab is disabled
 */
const TabsTrigger = React.forwardRef(({ className, children, icon, disabled, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    disabled={disabled}
    className={cn(
      "relative z-10 inline-flex items-center justify-center gap-2",
      "px-4 py-2 text-sm font-medium",
      "text-slate-600 dark:text-slate-400",
      "rounded-[10px]",
      "transition-all duration-200",
      "hover:text-slate-900 dark:hover:text-slate-100",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:text-slate-900 dark:data-[state=active]:text-white",
      "data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  >
    {icon && (
      <span className="text-base leading-none">{icon}</span>
    )}
    <span>{children}</span>
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = "TabsTrigger";

/**
 * TabsContent Component
 * @component
 * @description Content panel associated with a tab trigger
 *
 * @param {Object} props
 * @param {string} props.value - The value matching the corresponding trigger
 * @param {boolean} [props.forceMount] - Force mount the content for animation
 */
const TabsContent = React.forwardRef(({ className, forceMount, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    forceMount={forceMount}
    className={cn(
      "mt-4",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "data-[state=active]:animate-in data-[state=inactive]:animate-out",
      "data-[state=active]:fade-in-0 data-[state=inactive]:fade-out-0",
      "data-[state=active]:slide-in-from-top-2 data-[state=inactive]:slide-out-to-top-2",
      "duration-200",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
};

export default Tabs;
