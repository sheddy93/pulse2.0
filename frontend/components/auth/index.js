/**
 * Auth Components - Barrel Exports
 * 
 * Professional authentication layout components for PulseHR
 * 
 * @example
 * import { 
 *   AuthLayout, 
 *   AuthCard, 
 *   AuthCardHeader,
 *   AuthCardTitle,
 *   AuthCardDescription,
 *   AuthCardContent,
 *   AuthCardFooter,
 *   AuthHeader,
 *   AuthHeaderLogo,
 *   AuthFooter,
 *   AuthFooterBadges
 * } from '@/components/auth';
 */

// Layout Components
export { AuthLayout } from "./auth-layout";

// Card Components
export {
  AuthCard,
  AuthCardHeader,
  AuthCardTitle,
  AuthCardDescription,
  AuthCardContent,
  AuthCardFooter,
} from "./auth-card";

// Header Components
export { AuthHeader, AuthHeaderLogo } from "./auth-header";

// Footer Components
export { AuthFooter, AuthFooterBadges } from "./auth-footer";
