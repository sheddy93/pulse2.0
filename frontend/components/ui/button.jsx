"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

const _buttonStylesObj = {
  base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  variants: {
    default: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40",
    destructive: "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-500/25",
    outline: "border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-foreground hover:border-violet-300 hover:text-violet-600",
    secondary: "bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 shadow-lg shadow-slate-500/25",
    ghost: "hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 text-muted hover:text-foreground",
    link: "text-primary underline-offset-4 hover:underline hover:text-violet-600",
    success: "bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/25",
    warning: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25",
    info: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25",
    // New variants
    gradient: "bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white hover:shadow-xl hover:shadow-purple-500/30",
    soft: "bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200",
    subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  },
  sizes: {
    default: "h-11 px-5 py-2.5",
    sm: "h-9 rounded-lg px-4 text-xs",
    lg: "h-13 rounded-xl px-8 text-base",
    xl: "h-14 rounded-xl px-10 text-base font-semibold",
    icon: "h-11 w-11",
    "icon-sm": "h-9 w-9",
    "icon-lg": "h-13 w-13",
  },
};

const Button = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  asChild = false, 
  ...props 
}, ref) => {
  const Comp = asChild ? "span" : "button";
  
  return (
    <Comp
      className={cn(
        _buttonStylesObj.base,
        _buttonStylesObj.variants[variant] || _buttonStylesObj.variants.default,
        _buttonStylesObj.sizes[size] || _buttonStylesObj.sizes.default,
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

function getButtonClasses({ variant, size, className }) {
  return cn(
    _buttonStylesObj.base,
    _buttonStylesObj.variants[variant] || _buttonStylesObj.variants.default,
    _buttonStylesObj.sizes[size] || _buttonStylesObj.sizes.default,
    className
  );
}

// Export buttonStyles as a function for backward compatibility
function buttonStyles({ variant, size, className }) {
  return getButtonClasses({ variant, size, className });
}

export { Button, getButtonClasses, buttonStyles };
export default Button;