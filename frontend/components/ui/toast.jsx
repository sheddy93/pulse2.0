"use client";

import * as React from "react";
import { createContext, useContext, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

// Toast variants configuration
const toastVariants = {
  success: {
    icon: CheckCircle,
    iconClassName: "text-emerald-500",
    className: "border-emerald-200 dark:border-emerald-800",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "text-amber-500",
    className: "border-amber-200 dark:border-amber-800",
  },
  error: {
    icon: XCircle,
    iconClassName: "text-red-500",
    className: "border-red-200 dark:border-red-800",
  },
  info: {
    icon: Info,
    iconClassName: "text-sky-500",
    className: "border-sky-200 dark:border-sky-800",
  },
};

/**
 * Toast Component
 * @component
 * @description Individual toast notification item with animation
 *
 * @param {Object} props
 * @param {string} props.id - Unique toast identifier
 * @param {string} [props.title] - Toast title text
 * @param {string} [props.description] - Toast description/message
 * @param {('success'|'warning'|'error'|'info')} [props.variant='info'] - Toast variant
 * @param {Function} props.onClose - Callback to dismiss the toast
 */
const Toast = ({ id, title, description, variant = "info", onClose }) => {
  const config = toastVariants[variant] || toastVariants.info;
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4",
        "bg-white dark:bg-slate-900",
        "border rounded-[14px] shadow-lg",
        "animate-in slide-in-from-right-full duration-300",
        config.className,
        className
      )}
      role="alert"
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconClassName)} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {title}
          </p>
        )}
        {description && (
          <p className={cn("text-sm text-slate-500 dark:text-slate-400", title && "mt-1")}>
            {description}
          </p>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className={cn(
          "shrink-0 rounded-full p-1",
          "opacity-60 hover:opacity-100",
          "transition-opacity duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        )}
        aria-label="Close notification"
      >
        <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </button>
    </div>
  );
};

/**
 * ToastTitle Component
 * @component
 * @description Styled title for toast content
 */
const ToastTitle = ({ className, ...props }) => (
  <p
    className={cn("text-sm font-medium text-slate-900 dark:text-white", className)}
    {...props}
  />
);

/**
 * ToastDescription Component
 * @component
 * @description Styled description for toast content
 */
const ToastDescription = ({ className, ...props }) => (
  <p
    className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
    {...props}
  />
);

/**
 * ToastClose Component
 * @component
 * @description Close button for individual toast
 */
const ToastClose = ({ className, ...props }) => (
  <button
    className={cn(
      "shrink-0 rounded-full p-1",
      "opacity-60 hover:opacity-100",
      "transition-opacity duration-200",
      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
  </button>
);

// Context for toast state management
const ToastContext = createContext(null);

/**
 * ToastProvider Component
 * @component
 * @description Provider component that manages toast state and rendering
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, description, variant = "info" }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, dismissAll }}>
      {children}
      {/* Toast Container - Fixed position top-right */}
      <div
        className={cn(
          "fixed top-4 right-4 z-[100]",
          "flex flex-col gap-3",
          "w-full max-w-sm",
          "pointer-events-none"
        )}
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              title={toast.title}
              description={toast.description}
              variant={toast.variant}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * useToast Hook
 * @hook
 * @description Hook to access toast functionality from any component
 *
 * @example
 * const { toast, success, error, warning, info } = useToast();
 *
 * // Generic toast
 * toast({ title: "Hello", description: "World", variant: "info" });
 *
 * // Convenience methods
 * success({ title: "Success!", description: "Your changes have been saved." });
 * error({ title: "Error", description: "Something went wrong." });
 */
const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const { addToast, removeToast, dismissAll } = context;

  const toast = useCallback(
    ({ title, description, variant = "info" }) => {
      return addToast({ title, description, variant });
    },
    [addToast]
  );

  // Convenience methods
  toast.success = useCallback(
    (payload) => addToast({ ...payload, variant: "success" }),
    [addToast]
  );

  toast.error = useCallback(
    (payload) => addToast({ ...payload, variant: "error" }),
    [addToast]
  );

  toast.warning = useCallback(
    (payload) => addToast({ ...payload, variant: "warning" }),
    [addToast]
  );

  toast.info = useCallback(
    (payload) => addToast({ ...payload, variant: "info" }),
    [addToast]
  );

  toast.dismiss = removeToast;
  toast.dismissAll = dismissAll;

  return toast;
};

// Helper variable for cn function
let className = "";

export {
  ToastProvider,
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
};

export default ToastProvider;
