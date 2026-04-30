"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Dialog Component - PulseHR Design System
 * @component
 * @description Modal dialog built on Radix UI Dialog with elegant animations and styling
 *
 * @example
 * <Dialog open={isOpen} onOpenChange={setIsOpen}>
 *   <DialogTrigger>Open Dialog</DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Dialog Title</DialogTitle>
 *       <DialogDescription>Dialog description text</DialogDescription>
 *     </DialogHeader>
 *     <div>Content area</div>
 *     <DialogFooter>
 *       <DialogClose>Cancel</DialogClose>
 *       <Button>Confirm</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;
const DialogRoot = DialogPrimitive.Root;
const DialogTriggerPrimitive = DialogPrimitive.Trigger;

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      )}
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
        "bg-white dark:bg-slate-900 rounded-[24px] shadow-xl",
        "w-full max-w-lg max-h-[85vh] overflow-hidden",
        "flex flex-col",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "duration-200",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          "absolute right-5 top-5 rounded-full p-2",
          "opacity-70 hover:opacity-100",
          "transition-opacity duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "disabled:pointer-events-none"
        )}
      >
        <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

/**
 * DialogHeader Component
 * @component
 * @description Contains the title and description of the dialog
 */
const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col gap-2 p-6 pb-4", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/**
 * DialogFooter Component
 * @component
 * @description Contains action buttons at the bottom of the dialog
 */
const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex items-center justify-end gap-3 p-6 pt-4",
      "border-t border-slate-100 dark:border-slate-800",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

/**
 * DialogTitle Component
 * @component
 * @description The title text of the dialog
 */
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl font-semibold text-slate-900 dark:text-white",
      "leading-snug",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

/**
 * DialogDescription Component
 * @component
 * @description The description text below the title
 */
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-sm text-slate-500 dark:text-slate-400",
      "leading-relaxed",
      className
    )}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogPortal,
};

export default Dialog;
