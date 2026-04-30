'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

/**
 * PasswordInput Component
 * 
 * Password input with visibility toggle and strength indicator
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Required field
 * @param {boolean} props.showStrength - Show password strength indicator
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg'
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.name - Input name attribute
 * @param {string} props.id - Input id attribute
 * @param {string} props.autoComplete - Autocomplete attribute
 */
export default function PasswordInput({
  label,
  value,
  onChange,
  placeholder = 'Inserisci la password',
  error,
  required = false,
  showStrength = false,
  size = 'md',
  className = '',
  name,
  id,
  autoComplete = 'current-password',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

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

  // Calculate password strength
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { level: 0, label: '', color: '' },
      { level: 1, label: 'Molto debole', color: 'bg-red-500' },
      { level: 2, label: 'Debole', color: 'bg-orange-500' },
      { level: 3, label: 'Media', color: 'bg-yellow-500' },
      { level: 4, label: 'Forte', color: 'bg-green-500' },
      { level: 5, label: 'Molto forte', color: 'bg-emerald-600' },
    ];

    return levels[Math.min(strength, 5)];
  };

  const strength = showStrength ? getPasswordStrength(value) : null;

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Lock Icon */}
        <div className={`
          absolute left-3 top-1/2 -translate-y-1/2 
          text-gray-400 dark:text-gray-500
          ${iconSizes[size]}
        `}>
          <Lock className={iconSizes[size]} />
        </div>

        {/* Input */}
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          name={name}
          id={id}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`
            w-full rounded-lg border transition-all duration-200
            ${sizeClasses[size]}
            pl-10 pr-11
            ${error
              ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500 dark:focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500'
            }
            bg-white dark:bg-gray-900 
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-offset-0
            dark:focus:ring-offset-gray-900
            ${className}
          `}
          {...props}
        />

        {/* Toggle Visibility Button */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={`
            absolute right-3 top-1/2 -translate-y-1/2
            text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
            transition-colors duration-200
            focus:outline-none focus:text-gray-600 dark:focus:text-gray-300
            ${iconSizes[size]}
          `}
          aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
        >
          {showPassword ? (
            <EyeOff className={iconSizes[size]} />
          ) : (
            <Eye className={iconSizes[size]} />
          )}
        </button>
      </div>

      {/* Password Strength Indicator */}
      {showStrength && value && strength.level > 0 && (
        <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
          {/* Strength Bars */}
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`
                  h-1.5 flex-1 rounded-full transition-all duration-300
                  ${level <= strength.level ? strength.color : 'bg-gray-200 dark:bg-gray-700'}
                `}
              />
            ))}
          </div>
          
          {/* Strength Label */}
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Sicurezza: <span className="font-medium">{strength.label}</span>
          </p>
        </div>
      )}
    </div>
  );
}
