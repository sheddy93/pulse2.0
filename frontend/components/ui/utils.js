/**
 * UI Consistency Utilities
 * Ensures consistent spacing, typography, and responsive behavior
 */

import { cn } from "@/lib/cn";

// ============================================================================
// SPACING SYSTEM
// Based on 4px grid: xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48
// ============================================================================

export const spacing = {
  // Padding utilities
  p: {
    xs: "p-1",    // 4px
    sm: "p-2",    // 8px
    md: "p-4",    // 16px
    lg: "p-6",    // 24px
    xl: "p-8",    // 32px
  },
  px: {
    xs: "px-1",
    sm: "px-2",
    md: "px-4",
    lg: "px-6",
    xl: "px-8",
  },
  py: {
    xs: "py-1",
    sm: "py-2",
    md: "py-4",
    lg: "py-6",
    xl: "py-8",
  },
  // Margin utilities
  m: {
    auto: "m-auto",
    xs: "m-1",
    sm: "m-2",
    md: "m-4",
    lg: "m-6",
  },
  gap: {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  },
};

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const typography = {
  // Font sizes with line heights
  heading: {
    1: "text-3xl font-bold tracking-tight",    // 30px - Page titles
    2: "text-2xl font-bold tracking-tight",    // 24px - Section titles
    3: "text-xl font-semibold",                // 20px - Card titles
    4: "text-lg font-semibold",                // 18px - Subsections
  },
  body: {
    lg: "text-base leading-relaxed",           // 16px - Body text
    md: "text-sm leading-relaxed",             // 14px - Secondary text
    sm: "text-xs leading-relaxed",             // 12px - Captions
  },
  labels: {
    lg: "text-sm font-medium",                 // Labels
    md: "text-xs font-medium",                 // Small labels
    sm: "text-[10px] font-medium uppercase tracking-wider", // Badges
  },
};

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

export const responsive = {
  // Container widths
  container: {
    sm: "max-w-screen-sm",     // 640px
    md: "max-w-screen-md",     // 768px
    lg: "max-w-screen-lg",     // 1024px
    xl: "max-w-screen-xl",     // 1280px
    full: "max-w-full",
  },
  
  // Grid columns responsive
  gridCols: {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  },
};

// ============================================================================
// COMPONENT PATTERNS
// Standardized component patterns for consistency
// ============================================================================

/**
 * Standard card padding pattern
 * Mobile: p-4, Tablet+: p-6
 */
export const cardPadding = "p-4 sm:p-6";

/**
 * Standard form group spacing
 */
export const formGroupSpacing = "space-y-1.5";

/**
 * Standard section spacing
 */
export const sectionSpacing = "space-y-6";

/**
 * Standard page padding
 */
export const pagePadding = "p-4 md:p-6 lg:p-8";

/**
 * Glass effect for overlays
 */
export const glassEffect = "backdrop-blur-md bg-surface/80";

/**
 * Standard button sizes
 */
export const buttonSizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

/**
 * Standard input heights
 */
export const inputSizes = {
  sm: "h-8 text-xs",
  md: "h-10 text-sm",
  lg: "h-12 text-base",
};

/**
 * Animation presets
 */
export const animations = {
  fadeIn: "animate-in fade-in duration-200",
  slideIn: "animate-in slide-in-from-bottom-4 duration-300",
  scaleIn: "animate-in zoom-in-95 duration-200",
};

/**
 * Focus ring styles
 */
export const focusRing = "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface";

/**
 * Create consistent card class
 */
export function createCard({ 
  variant = "default", 
  padding = true, 
  hover = true,
  className = "" 
}) {
  const variants = {
    default: "border-border bg-surface",
    elevated: "border-border bg-surface shadow-lg",
    outline: "border-border bg-transparent",
    ghost: "border-transparent bg-transparent hover:bg-bg-muted",
    filled: "border-transparent bg-bg-muted",
  };

  return cn(
    "rounded-xl",
    variants[variant],
    padding && cardPadding,
    hover && "hover:shadow-md transition-shadow duration-200",
    className
  );
}

/**
 * Create consistent button class
 */
export function createButton({ 
  variant = "default", 
  size = "md", 
  loading = false,
  disabled = false,
  className = "" 
}) {
  const variants = {
    default: "bg-primary text-white hover:bg-primary-strong",
    outline: "border border-border bg-transparent hover:bg-bg-muted",
    ghost: "bg-transparent hover:bg-bg-muted",
    danger: "bg-danger text-white hover:bg-danger/90",
    success: "bg-success text-white hover:bg-success/90",
    link: "bg-transparent underline-offset-4 hover:underline text-primary",
  };

  return cn(
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors",
    buttonSizes[size],
    variants[variant],
    loading && "opacity-70 cursor-wait",
    disabled && "opacity-50 cursor-not-allowed",
    focusRing,
    className
  );
}

/**
 * Create consistent input class
 */
export function createInput({ 
  size = "md", 
  error = false,
  className = "" 
}) {
  return cn(
    "w-full rounded-lg border bg-surface text-foreground placeholder:text-muted",
    "transition-colors focus:border-primary focus:ring-1 focus:ring-primary",
    inputSizes[size],
    error 
      ? "border-danger focus:border-danger focus:ring-danger" 
      : "border-border",
    className
  );
}

/**
 * Create badge class
 */
export function createBadge({ 
  variant = "default", 
  size = "md",
  className = "" 
}) {
  const variants = {
    default: "bg-bg-muted text-muted",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    info: "bg-info/10 text-info",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-1 text-xs",
    lg: "px-2.5 py-1 text-sm",
  };

  return cn(
    "inline-flex items-center font-medium rounded-full",
    variants[variant],
    sizes[size],
    className
  );
}

export default {
  spacing,
  typography,
  responsive,
  cardPadding,
  formGroupSpacing,
  sectionSpacing,
  pagePadding,
  glassEffect,
  buttonSizes,
  inputSizes,
  animations,
  focusRing,
  createCard,
  createButton,
  createInput,
  createBadge,
};
