"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/cn";

// Size configurations
const avatarSizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

// Status indicator sizes
const statusSizes = {
  sm: "h-2.5 w-2.5 border",
  md: "h-3 w-3 border-2",
  lg: "h-3.5 w-3.5 border-2",
  xl: "h-4 w-4 border-2",
};

// Status colors
const statusColors = {
  online: "bg-emerald-500",
  busy: "bg-red-500",
  offline: "bg-slate-400",
};

/**
 * Avatar Component - PulseHR Design System
 * @component
 * @description Avatar component built on Radix UI Avatar with fallback initials and status indicators
 *
 * @example
 * // Basic avatar with image
 * <Avatar>
 *   <AvatarImage src="/user.jpg" alt="User" />
 *   <AvatarFallback>JD</AvatarFallback>
 * </Avatar>
 *
 * // With status indicator
 * <Avatar>
 *   <AvatarImage src="/user.jpg" />
 *   <AvatarFallback>JD</AvatarFallback>
 *   <AvatarStatus status="online" />
 * </Avatar>
 */
const Avatar = React.forwardRef(({ className, size = "md", ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex shrink-0 overflow-hidden rounded-full",
      avatarSizes[size] || avatarSizes.md,
      "ring-2 ring-white dark:ring-slate-800",
      "shadow-sm",
      className
    )}
    {...props}
  />
));
Avatar.displayName = "Avatar";

/**
 * AvatarImage Component
 * @component
 * @description The image element of the avatar
 *
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Image alt text
 */
const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

/**
 * AvatarFallback Component
 * @component
 * @description Fallback content when image fails to load - displays initials
 *
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 */
const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center",
      "bg-primary/10 text-primary font-medium",
      "dark:bg-primary/20",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";

/**
 * AvatarStatus Component
 * @component
 * @description Status indicator badge (online, busy, offline)
 *
 * @param {Object} props
 * @param {('online'|'busy'|'offline')} props.status - The status type
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md'] - Size of the status indicator
 * @param {string} [props.className] - Additional CSS classes
 */
const AvatarStatus = ({ status, size = "md", className, ...props }) => (
  <span
    className={cn(
      "absolute bottom-0 right-0 rounded-full",
      "ring-2 ring-white dark:ring-slate-900",
      statusSizes[size] || statusSizes.md,
      statusColors[status] || statusColors.offline,
      className
    )}
    role="status"
    aria-label={`Status: ${status}`}
    {...props}
  />
);
AvatarStatus.displayName = "AvatarStatus";

/**
 * Helper function to get initials from a name
 * @param {string} name - The full name
 * @param {number} [maxLength=2] - Maximum initials count
 * @returns {string} The initials
 */
const getInitials = (name, maxLength = 2) => {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return parts
    .slice(0, maxLength)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

/**
 * AvatarWithStatus Component
 * @component
 * @description Convenience component combining Avatar, AvatarImage, AvatarFallback, and AvatarStatus
 *
 * @example
 * <AvatarWithStatus
 *   src="/user.jpg"
 *   name="John Doe"
 *   status="online"
 *   size="lg"
 * />
 */
const AvatarWithStatus = ({
  src,
  name,
  status,
  size = "md",
  className,
  fallbackClassName,
  ...props
}) => (
  <Avatar size={size} className={className} {...props}>
    <AvatarImage src={src} alt={name || "Avatar"} />
    <AvatarFallback className={fallbackClassName}>
      {getInitials(name)}
    </AvatarFallback>
    {status && <AvatarStatus status={status} size={size} />}
  </Avatar>
);
AvatarWithStatus.displayName = "AvatarWithStatus";

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarStatus,
  AvatarWithStatus,
  getInitials,
};

export default Avatar;
