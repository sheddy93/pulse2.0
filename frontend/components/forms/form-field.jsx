'use client';

import { AlertCircle } from 'lucide-react';

/**
 * FormField Component
 * 
 * Reusable form field wrapper with label, error handling, and helper text
 * 
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {boolean} props.required - Show required asterisk
 * @param {string} props.error - Error message to display
 * @param {string} props.helperText - Helper text below the field
 * @param {string} props.htmlFor - ID of the input element
 * @param {React.ReactNode} props.children - Input component(s)
 * @param {string} props.className - Additional CSS classes
 */
export default function FormField({
  label,
  required = false,
  error,
  helperText,
  htmlFor,
  children,
  className = '',
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="obbligatorio">
              *
            </span>
          )}
        </label>
      )}

      {/* Input Slot */}
      <div className="relative">
        {children}
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="flex items-start space-x-1.5 text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-top-1 duration-200"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper Text */}
      {!error && helperText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
