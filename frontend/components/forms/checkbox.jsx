'use client';

import { Check } from 'lucide-react';

/**
 * Checkbox Component
 * 
 * Custom styled checkbox with label and error states
 * 
 * @param {Object} props
 * @param {string} props.label - Checkbox label (can include JSX)
 * @param {boolean} props.checked - Checked state
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Required field
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.name - Checkbox name attribute
 * @param {string} props.id - Checkbox id attribute
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg'
 */
export default function Checkbox({
  label,
  checked = false,
  onChange,
  error,
  required = false,
  className = '',
  name,
  id,
  disabled = false,
  size = 'md',
  ...props
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={className}>
      <label className="flex items-start cursor-pointer group">
        {/* Hidden native checkbox for accessibility */}
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          name={name}
          id={id}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          className="sr-only peer"
          {...props}
        />

        {/* Custom checkbox */}
        <div className={`
          relative flex-shrink-0 rounded border-2 transition-all duration-200
          ${sizeClasses[size]}
          ${error
            ? 'border-red-500 dark:border-red-500'
            : checked
              ? 'border-violet-600 bg-violet-600 dark:border-violet-500 dark:bg-violet-500'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
          }
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'group-hover:border-violet-500 dark:group-hover:border-violet-400'
          }
          peer-focus:ring-2 peer-focus:ring-violet-500 peer-focus:ring-offset-2
          dark:peer-focus:ring-offset-gray-900
        `}>
          {/* Checkmark */}
          {checked && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <Check className={iconSizes[size]} strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Label */}
        {label && (
          <span className={`
            ml-3 select-none transition-colors duration-200
            ${labelSizes[size]}
            ${error
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-700 dark:text-gray-300'
            }
            ${disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'group-hover:text-gray-900 dark:group-hover:text-gray-100'
            }
          `}>
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="obbligatorio">
                *
              </span>
            )}
          </span>
        )}
      </label>
    </div>
  );
}
