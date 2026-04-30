# PulseHR Auth Components

Professional, reusable authentication layout components for PulseHR with responsive design and glass-morphism styling.

## Components Overview

### 1. **AuthLayout** (`auth-layout.jsx`)
Professional split-layout component for authentication pages.

**Features:**
- **Left Panel (40% width)**: Hidden on mobile, visible on `lg+` screens
  - Gradient background (violet-600 → purple-600 → indigo-700)
  - PulseHR logo and branding
  - Tagline and marketing copy
  - Animated decorative floating shapes
- **Right Panel (60% width)**: Always visible
  - Contains form content
  - Centered layout
  - Clean background

**Usage:**
```jsx
import { AuthLayout } from '@/components/auth';

<AuthLayout>
  {/* Your auth content */}
</AuthLayout>
```

---

### 2. **AuthCard** (`auth-card.jsx`)
Glass-morphism card container for auth forms.

**Components:**
- `AuthCard` - Main container with glass effect
- `AuthCardHeader` - Header section
- `AuthCardTitle` - Large title text
- `AuthCardDescription` - Subtitle/description text
- `AuthCardContent` - Main content/form area
- `AuthCardFooter` - Footer section with muted background

**Features:**
- Glass-morphism with backdrop blur
- Rounded corners (xl)
- Subtle shadow and border
- Responsive padding

**Usage:**
```jsx
import { 
  AuthCard, 
  AuthCardHeader, 
  AuthCardTitle,
  AuthCardDescription,
  AuthCardContent,
  AuthCardFooter 
} from '@/components/auth';

<AuthCard>
  <AuthCardHeader>
    <AuthCardTitle>Welcome Back</AuthCardTitle>
    <AuthCardDescription>Enter your credentials</AuthCardDescription>
  </AuthCardHeader>
  <AuthCardContent>
    {/* Your form */}
  </AuthCardContent>
  <AuthCardFooter>
    {/* Footer content */}
  </AuthCardFooter>
</AuthCard>
```

---

### 3. **AuthHeader** (`auth-header.jsx`)
Logo and controls header for authentication pages.

**Components:**
- `AuthHeader` - Full header with logo, language toggle, and theme toggle
- `AuthHeaderLogo` - Simplified logo-only variant

**Features:**
- PulseHR branding with Activity icon
- Integrated LanguageToggle component
- Integrated ThemeToggle component
- Optional controls (`showControls` prop)

**Usage:**
```jsx
import { AuthHeader, AuthHeaderLogo } from '@/components/auth';

// Full header with controls
<AuthHeader />

// Without controls
<AuthHeader showControls={false} />

// Logo only
<AuthHeaderLogo />
```

---

### 4. **AuthFooter** (`auth-footer.jsx`)
Security badges and compliance footer.

**Components:**
- `AuthFooter` - Full footer with badges and text
- `AuthFooterBadges` - Simplified badges-only variant

**Features:**
- Lock icon - "Dati Protetti" / "Data Protected"
- Shield icon - "Crittografia SSL" / "SSL Encryption"
- CheckCircle icon - "Conforme GDPR" / "GDPR Compliant"
- Bilingual support (IT/EN)
- Responsive layout

**Usage:**
```jsx
import { AuthFooter, AuthFooterBadges } from '@/components/auth';

// Full footer
<AuthFooter />

// Badges only
<AuthFooterBadges />
```

---

## Complete Example

```jsx
"use client";

import {
  AuthLayout,
  AuthCard,
  AuthCardHeader,
  AuthCardTitle,
  AuthCardDescription,
  AuthCardContent,
  AuthCardFooter,
  AuthHeader,
  AuthFooter,
} from "@/components/auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthHeader />
      
      <AuthCard>
        <AuthCardHeader>
          <AuthCardTitle>Accedi a PulseHR</AuthCardTitle>
          <AuthCardDescription>
            Inserisci le tue credenziali per accedere
          </AuthCardDescription>
        </AuthCardHeader>

        <AuthCardContent>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="nome@azienda.it"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="••••••••"
              />
            </div>
            <Button className="w-full" size="lg">
              Accedi
            </Button>
          </form>
        </AuthCardContent>

        <AuthCardFooter>
          <p className="text-sm text-muted text-center w-full">
            Non hai un account?{" "}
            <a href="/register" className="text-primary font-medium">
              Registrati
            </a>
          </p>
        </AuthCardFooter>
      </AuthCard>

      <AuthFooter />
    </AuthLayout>
  );
}
```

---

## Design System Integration

All components integrate seamlessly with the existing PulseHR design system:

- **Tailwind CSS**: Uses custom CSS variables for colors
- **Theme Support**: Works with dark/light themes via ThemeProvider
- **Language Support**: Bilingual (IT/EN) via LanguageProvider
- **Icons**: Uses lucide-react icons
- **Typography**: Uses design system fonts and sizing
- **Colors**: Leverages primary, surface, border, and muted colors

---

## Responsive Design

- **Mobile (< 1024px)**: Single column layout, left panel hidden
- **Desktop (≥ 1024px)**: Split layout (40% left, 60% right)
- All components have responsive padding and text sizes

---

## File Structure

```
components/auth/
├── auth-layout.jsx      # Split-panel layout
├── auth-card.jsx        # Glass-morphism card components
├── auth-header.jsx      # Logo + controls header
├── auth-footer.jsx      # Security badges footer
├── index.js             # Barrel exports
├── example-usage.jsx    # Usage examples
└── README.md            # This file
```

---

## Dependencies

- `lucide-react` - Icons
- `@/lib/cn` - Utility for className merging
- `@/components/language-provider` - Language context
- `@/components/theme-provider` - Theme context
- `@/components/language-toggle` - Language switcher
- `@/components/theme-toggle` - Theme switcher

---

## Notes

- All components use the `"use client"` directive for Next.js client components
- Glass-morphism effects use backdrop-blur for modern browsers
- Animations use Tailwind's built-in animation utilities
- All text content supports bilingual display (IT/EN)

---

For more examples, see `example-usage.jsx`.
