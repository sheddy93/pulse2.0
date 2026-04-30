"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/cn";

// Arrow component for submenus
const DropdownMenuArrow = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Arrow
    ref={ref}
    className={cn("fill-white dark:fill-slate-900", className)}
    {...props}
  />
));
DropdownMenuArrow.displayName = "DropdownMenuArrow";

/**
 * DropdownMenu Component - PulseHR Design System
 * @component
 * @description Dropdown menu built on Radix UI DropdownMenu with icons, shortcuts, and submenu support
 *
 * @example
 * <DropdownMenu>
 *   <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuLabel>Section Label</DropdownMenuLabel>
 *     <DropdownMenuItem icon={<Copy />}>Copy</DropdownMenuItem>
 *     <DropdownMenuItem icon={<Edit />} shortcut="Cmd+E">Edit</DropdownMenuItem>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem variant="destructive" icon={<Trash />}>Delete</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 */
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/**
 * DropdownMenuContent Component
 * @component
 * @description The floating content panel of the dropdown menu
 */
const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 8, children, ...props }, ref) => (
  <DropdownMenuPortal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[200px] overflow-hidden",
        "bg-white dark:bg-slate-900",
        "rounded-[14px] p-1",
        "shadow-lg ring-1 ring-black/5 dark:ring-white/10",
        "border border-slate-100 dark:border-slate-800",
        "animate-in fade-in-0 zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        "duration-200",
        className
      )}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Content>
  </DropdownMenuPortal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

/**
 * DropdownMenuItem Component
 * @component
 * @description Individual menu item with optional icon and keyboard shortcut
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.icon] - Icon to display before the label
 * @param {string} [props.shortcut] - Keyboard shortcut hint to display
 * @param {boolean} [props.disabled] - Whether the item is disabled
 * @param {('default'|'destructive')} [props.variant='default'] - Item variant
 */
const DropdownMenuItem = React.forwardRef(({ className, icon, shortcut, disabled, variant = "default", inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    disabled={disabled}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2",
      "rounded-[10px] px-3 py-2.5",
      "text-sm font-medium",
      "outline-none transition-colors duration-150",
      "focus:bg-slate-100 dark:focus:bg-slate-800",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      variant === "destructive" && [
        "text-red-600 dark:text-red-400",
        "focus:bg-red-50 dark:focus:bg-red-900/20",
      ],
      variant === "default" && [
        "text-slate-900 dark:text-white",
      ],
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {icon && (
      <span className={cn(
        "flex h-5 w-5 items-center justify-center",
        "text-slate-500 dark:text-slate-400",
        variant === "destructive" && "text-red-500 dark:text-red-400"
      )}>
        {icon}
      </span>
    )}
    <span className="flex-1">{props.children}</span>
    {shortcut && (
      <span className="ml-2 text-xs text-slate-400 dark:text-slate-500 font-normal">
        {shortcut}
      </span>
    )}
  </DropdownMenuPrimitive.Item>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

/**
 * DropdownMenuCheckboxItem Component
 * @component
 * @description Checkbox item for dropdown menu with check indicator
 */
const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center",
      "rounded-[10px] py-2 pl-10 pr-3",
      "text-sm font-medium",
      "text-slate-900 dark:text-white",
      "outline-none transition-colors duration-150",
      "focus:bg-slate-100 dark:focus:bg-slate-800",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-primary" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

/**
 * DropdownMenuRadioItem Component
 * @component
 * @description Radio item for dropdown menu
 */
const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center",
      "rounded-[10px] py-2 pl-10 pr-3",
      "text-sm font-medium",
      "text-slate-900 dark:text-white",
      "outline-none transition-colors duration-150",
      "focus:bg-slate-100 dark:focus:bg-slate-800",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

/**
 * DropdownMenuLabel Component
 * @component
 * @description Section label within the dropdown menu
 */
const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-2 text-xs font-semibold uppercase tracking-wider",
      "text-slate-500 dark:text-slate-400",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

/**
 * DropdownMenuSeparator Component
 * @component
 * @description Visual separator between menu items
 */
const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn(
      "-mx-1 my-1 h-px",
      "bg-slate-100 dark:bg-slate-800",
      className
    )}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

/**
 * DropdownMenuSubTrigger Component
 * @component
 * @description Trigger for nested submenu with chevron indicator
 */
const DropdownMenuSubTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center",
      "rounded-[10px] px-3 py-2.5",
      "text-sm font-medium",
      "text-slate-900 dark:text-white",
      "outline-none transition-colors duration-150",
      "focus:bg-slate-100 dark:focus:bg-slate-800",
      "data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

/**
 * DropdownMenuSubContent Component
 * @component
 * @description Content panel for nested submenu
 */
const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[180px] overflow-hidden",
      "bg-white dark:bg-slate-900",
      "rounded-[14px] p-1",
      "shadow-lg ring-1 ring-black/5 dark:ring-white/10",
      "border border-slate-100 dark:border-slate-800",
      "animate-in fade-in-0 zoom-in-95",
      "data-[side=bottom]:slide-in-from-top-2",
      "data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2",
      "data-[side=top]:slide-in-from-bottom-2",
      "duration-200",
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuArrow,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuRadioGroup,
};

export default DropdownMenu;
