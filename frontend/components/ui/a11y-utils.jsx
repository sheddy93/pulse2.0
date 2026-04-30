// components/ui/a11y-utils.jsx

// Focus ring style for keyboard navigation
export const focusRing = 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

// Skip to main content link (da mettere in layout)
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
    >
      Vai al contenuto principale
    </a>
  );
}

// Screen reader only text
export function VisuallyHidden({ children }) {
  return <span className="sr-only">{children}</span>;
}

// Label required indicator
export function RequiredLabel({ children }) {
  return (
    <>
      {children}
      <span className="text-red-500 ml-1" aria-hidden="true">*</span>
      <span className="sr-only">(obbligatorio)</span>
    </>
  );
}

// Helper to generate aria-describedby for field errors
export function ariaDescribedBy(fieldId, errorId) {
  return errorId ? `${fieldId}-error` : undefined;
}

// Announce message for screen readers
export function AriaLive({ message, priority = 'polite' }) {
  return (
    <div
      role="status"
      aria-live={priority}
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Keyboard navigation helper
export function keyboardNavigation({
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown,
  onTab,
}) {
  return {
    onKeyDown: (e) => {
      switch (e.key) {
        case 'Enter':
          onEnter?.(e);
          break;
        case 'Escape':
          onEscape?.(e);
          break;
        case 'ArrowUp':
          onArrowUp?.(e);
          break;
        case 'ArrowDown':
          onArrowDown?.(e);
          break;
        case 'Tab':
          onTab?.(e);
          break;
      }
    },
  };
}

// Role-based aria attributes for interactive elements
export function menuItemProps(isActive, isDisabled = false) {
  return {
    role: 'menuitem',
    'aria-selected': isActive,
    'aria-disabled': isDisabled,
    tabIndex: isDisabled ? -1 : 0,
  };
}

// Modal accessibility props
export function modalProps({ isOpen, title, describedBy }) {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': title ? `${title}-label` : undefined,
    'aria-describedby': describedBy,
    hidden: !isOpen,
  };
}

// Table accessibility helpers
export function tableHeaderCellProps(column, index) {
  return {
    scope: 'col',
    'aria-colindex': index + 1,
  };
}

export function tableCellProps(rowIndex, colIndex) {
  return {
    'aria-rowindex': rowIndex + 1,
    'aria-colindex': colIndex + 1,
  };
}