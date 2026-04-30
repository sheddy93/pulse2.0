'use client';

import { Check } from 'lucide-react';

/**
 * StepIndicator Component
 * 
 * Professional multi-step progress indicator with visual feedback
 * 
 * @param {Object} props
 * @param {Array<{label: string, description?: string}>} props.steps - Array of step objects
 * @param {number} props.currentStep - Current active step (0-indexed)
 * @param {Function} props.onStepClick - Optional callback for clickable steps
 * @param {string} props.className - Additional CSS classes
 */
export default function StepIndicator({ steps = [], currentStep = 0, onStepClick, className = '' }) {
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;
          const isClickable = onStepClick && (isCompleted || isActive);

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step Item */}
              <div className="flex flex-col items-center flex-1">
                {/* Step Circle */}
                <button
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full
                    transition-all duration-200 font-semibold text-sm
                    ${isCompleted ? 'bg-violet-600 text-white dark:bg-violet-500' : ''}
                    ${isActive ? 'bg-blue-600 text-white dark:bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900' : ''}
                    ${isPending ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400' : ''}
                    ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  `}
                  aria-label={`${step.label}${isCompleted ? ' - Completato' : isActive ? ' - Attivo' : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <p className={`
                    text-sm font-medium transition-colors duration-200
                    ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}
                    ${isCompleted ? 'text-violet-600 dark:text-violet-400' : ''}
                    ${isPending ? 'text-gray-500 dark:text-gray-400' : ''}
                  `}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 mb-8">
                  <div className={`
                    h-full transition-all duration-300
                    ${index < currentStep ? 'bg-violet-600 dark:bg-violet-500' : 'bg-gray-200 dark:bg-gray-700'}
                  `} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Compact vertical layout */}
      <div className="md:hidden">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Passo {currentStep + 1} di {steps.length}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current step info */}
        <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
            {currentStep + 1}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {steps[currentStep]?.label}
            </p>
            {steps[currentStep]?.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {steps[currentStep].description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
