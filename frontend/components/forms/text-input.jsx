'use client';

/**
 * TextInput Component
 * 
 * Customizable text input with support for icons, sizes, and error states
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.type - Input type (text, email, etc.)
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Required field
 * @param {React.ReactNode} props.leftIcon - Icon component for left side
 * @param {React.ReactNode} props.rightIcon - Icon component for right side
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg'
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.name - Input name attribute
 * @param {string} props.id - Input id attribute
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.autoComplete - Autocomplete attribute
 */
export default function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  required = false,
  leftIcon,
  rightIcon,
  size = 'md',
  className = '',
  name,
  id,
  disabled = false,
  autoComplete,
  ...props
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
  };

  return (
    <div className="relative">
      {/* Left Icon */}
      {leftIcon && (
        <div className={`
          absolute left-3 top-1/2 -translate-y-1/2 
          text-gray-400 dark:text-gray-500
          ${iconSizes[size]}
        `}>
          {leftIcon}
        </div>
      )}

      {/* Input */}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        id={id}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`
          w-full rounded-lg border transition-all duration-200
          ${sizeClasses[size]}
          ${leftIcon ? 'pl-10' : ''}
          ${rightIcon ? 'pr-10' : ''}
          ${error
            ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500 dark:focus:border-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500'
          }
          ${disabled
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
          }
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          focus:outline-none focus:ring-2 focus:ring-offset-0
          dark:focus:ring-offset-gray-900
          ${className}
        `}
        {...props}
      />

      {/* Right Icon */}
      {rightIcon && (
        <div className={`
          absolute right-3 top-1/2 -translate-y-1/2 
          text-gray-400 dark:text-gray-500
          ${iconSizes[size]}
        `}>
          {rightIcon}
        </div>
      )}
    </div>
  );
}
