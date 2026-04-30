"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

const Card = React.forwardRef(({ className, elevated = false, glass = false, children, ...props }, ref) => {
  const cardClasses = cn(
    "rounded-xl border",
    glass 
      ? "bg-glass border-glass-border backdrop-blur-[14px]" 
      : elevated 
        ? "bg-surface-elevated border-border shadow-medium" 
        : "bg-card border-border shadow-soft",
    className
  );
  
  return (
    <div ref={ref} className={cardClasses} {...props}>
      {children}
    </div>
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-5", className)} {...props}>
    {children}
  </div>
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)} {...props}>
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <p className={cn("text-sm text-muted", className)} {...props}>
    {children}
  </p>
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props}>
    {children}
  </div>
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-5 pt-0", className)} {...props}>
    {children}
  </div>
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
