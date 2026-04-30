# Language Switcher Component - PulseHR

Professional segmented language switcher with smooth animations and dark mode support.

## 📁 Files Created

- `language-switcher-segmented.jsx` - Main component
- `language-switcher-examples.jsx` - Usage examples
- `LANGUAGE-SWITCHER-README.md` - This documentation

## 🚀 Quick Start

### Option 1: With Provider (Recommended)

Wrap your app with `LanguageProvider` in your root layout:

```jsx
// app/layout.jsx
import { LanguageProvider } from "@/components/language-switcher-segmented";

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
```

Then use the switcher anywhere:

```jsx
import LanguageSwitcherSegmented from "@/components/language-switcher-segmented";

export default function Header() {
  return (
    <header>
      <LanguageSwitcherSegmented size="compact" />
    </header>
  );
}
```

### Option 2: Standalone (No Provider)

```jsx
import { LanguageSwitcherStandalone } from "@/components/language-switcher-segmented";

export default function MyComponent() {
  const handleChange = (lang) => {
    console.log("Language changed to:", lang);
  };

  return (
    <LanguageSwitcherStandalone 
      size="default" 
      onChange={handleChange}
      defaultLanguage="IT"
    />
  );
}
```

## 🎨 Size Options

```jsx
// Compact - Perfect for headers
<LanguageSwitcherSegmented size="compact" />

// Default - Standard size
<LanguageSwitcherSegmented size="default" />

// Large - Emphasized placement
<LanguageSwitcherSegmented size="large" />
```

## 🔌 Using the Language in Your Components

```jsx
import { useLanguage } from "@/components/language-switcher-segmented";

function MyComponent() {
  const { language, setLanguage } = useLanguage();

  const text = {
    IT: "Benvenuto",
    EN: "Welcome"
  };

  return (
    <div>
      <h1>{text[language]}</h1>
      <button onClick={() => setLanguage("EN")}>
        Switch to English
      </button>
    </div>
  );
}
```

## ✨ Features

### 1. **Automatic Persistence**
- Saves to `localStorage` as "language"
- Survives page refreshes
- Auto-loads on mount

### 2. **Multi-Component Sync**
- All switchers automatically sync
- Uses React Context
- Custom event dispatch for cross-context sync

### 3. **Premium Animations**
- 300ms smooth slide transition
- Gradient blue background for active state
- Subtle hover effects
- Shadow effects with blue glow

### 4. **Accessibility**
- Full ARIA support (`role="tablist"`, `aria-selected`)
- Keyboard navigation
- Focus visible rings
- Screen reader labels

### 5. **Dark Mode**
- Automatic dark mode support
- Uses existing design system colors
- Smooth theme transitions

### 6. **Hydration Safe**
- No hydration mismatches
- Renders placeholder during SSR
- Proper client-side mounting

## 🎯 Real-World Examples

### Header Navigation
```jsx
<header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
  <div className="container flex items-center justify-between py-4">
    <div className="flex items-center gap-3">
      <Logo />
      <span className="text-xl font-bold">PulseHR</span>
    </div>
    
    <nav className="flex items-center gap-6">
      <a href="/dashboard">Dashboard</a>
      <a href="/employees">Dipendenti</a>
      <LanguageSwitcherSegmented size="compact" />
    </nav>
  </div>
</header>
```

### Settings Panel
```jsx
<div className="settings-panel">
  <div className="flex items-center justify-between py-5">
    <div>
      <label className="font-semibold">Lingua / Language</label>
      <p className="text-sm text-slate-600">Seleziona la tua lingua</p>
    </div>
    <LanguageSwitcherSegmented size="default" />
  </div>
</div>
```

### Dashboard Widget
```jsx
<div className="bg-gradient-to-br from-blue-50 to-violet-50 p-8 rounded-2xl">
  <div className="flex justify-between items-center">
    <div>
      <h3 className="text-lg font-semibold">
        {language === "IT" ? "Benvenuto" : "Welcome"}
      </h3>
      <p className="text-sm text-slate-600">
        {language === "IT" 
          ? "Gestisci il tuo team" 
          : "Manage your team"}
      </p>
    </div>
    <LanguageSwitcherSegmented size="large" />
  </div>
</div>
```

## 🎨 Design System Integration

The component uses your existing design tokens:

- **Primary Color**: `#3b82f6` (blue-500)
- **Border Colors**: `slate-200` / `slate-700`
- **Background**: `slate-100` / `slate-800`
- **Text**: `slate-900` / `white`
- **Shadow**: Blue glow effect
- **Border Radius**: Full rounded (pill shape)
- **Transitions**: 300ms ease-in-out

## 🔄 Event System

The component dispatches a custom `languageChange` event:

```jsx
// Listen for language changes anywhere
useEffect(() => {
  const handleLanguageChange = (event) => {
    console.log("Language changed:", event.detail.language);
  };
  
  window.addEventListener("languageChange", handleLanguageChange);
  return () => {
    window.removeEventListener("languageChange", handleLanguageChange);
  };
}, []);
```

## 📐 Custom Styling

Add custom classes for special cases:

```jsx
<LanguageSwitcherSegmented 
  size="default"
  className="shadow-xl ring-2 ring-blue-500/20"
  ariaLabel="Selettore lingua"
/>
```

## 🌐 Internationalization Pattern

Create a translation hook:

```jsx
// hooks/useTranslation.js
import { useLanguage } from "@/components/language-switcher-segmented";

export function useTranslation() {
  const { language } = useLanguage();
  
  const translations = {
    IT: {
      welcome: "Benvenuto",
      dashboard: "Dashboard",
      employees: "Dipendenti",
      settings: "Impostazioni",
      logout: "Esci"
    },
    EN: {
      welcome: "Welcome",
      dashboard: "Dashboard",
      employees: "Employees",
      settings: "Settings",
      logout: "Logout"
    }
  };
  
  return (key) => translations[language][key] || key;
}

// Usage
function MyComponent() {
  const t = useTranslation();
  return <h1>{t("welcome")}</h1>;
}
```

## 🎭 Visual States

### Active State
- Blue gradient background (`from-blue-500 to-blue-600`)
- White text
- Bold font weight
- Blue shadow glow

### Inactive State
- Transparent background
- Gray text (`slate-600` / `slate-400`)
- Normal font weight
- Hover: Darker text

### Focus State
- Blue focus ring
- 2px ring width
- Offset for visibility

## 🔧 Props Reference

### LanguageSwitcherSegmented

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `"compact" \| "default" \| "large"` | `"default"` | Size variant |
| `className` | `string` | `""` | Additional CSS classes |
| `ariaLabel` | `string` | `"Language selector"` | ARIA label |

### LanguageSwitcherStandalone

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `"compact" \| "default" \| "large"` | `"default"` | Size variant |
| `className` | `string` | `""` | Additional CSS classes |
| `ariaLabel` | `string` | `"Language selector"` | ARIA label |
| `onChange` | `(lang: string) => void` | `undefined` | Callback on change |
| `defaultLanguage` | `"IT" \| "EN"` | `"IT"` | Initial language |

## 🧪 Testing the Component

```jsx
// In any page (e.g., app/test/page.jsx)
import LanguageSwitcherSegmented, { 
  LanguageProvider, 
  useLanguage 
} from "@/components/language-switcher-segmented";

function TestContent() {
  const { language } = useLanguage();
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Language Switcher Test</h1>
        <p>Current language: <strong>{language}</strong></p>
      </div>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-3">Compact</h2>
          <LanguageSwitcherSegmented size="compact" />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-3">Default</h2>
          <LanguageSwitcherSegmented size="default" />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-3">Large</h2>
          <LanguageSwitcherSegmented size="large" />
        </div>
      </div>
    </div>
  );
}

export default function TestPage() {
  return (
    <LanguageProvider>
      <TestContent />
    </LanguageProvider>
  );
}
```

## 💡 Tips

1. **Use compact size in headers** - It's designed for minimal space
2. **Use default size in forms** - Balanced visibility and space
3. **Use large size in hero sections** - Makes language choice prominent
4. **Wrap root layout** - Ensures language persists across navigation
5. **Check localStorage** - Language saved as `localStorage.getItem("language")`

## 🐛 Troubleshooting

### Hydration Mismatch
✅ **Solved**: Component includes SSR placeholder to prevent mismatches

### Multiple Switchers Not Syncing
✅ **Solved**: All switchers under same Provider auto-sync via context

### localStorage Not Working
- Ensure component is client-side (`"use client"`)
- Check browser console for errors
- Verify localStorage is enabled

### Dark Mode Issues
- Component uses your existing dark mode classes
- Ensure `dark` class is on `<html>` or parent element

## 🎨 Color Customization

To change colors, modify the component:

```jsx
// Current: Blue gradient
className="bg-gradient-to-r from-blue-500 to-blue-600"

// Custom: Violet gradient (secondary color)
className="bg-gradient-to-r from-violet-500 to-violet-600"

// Custom: Your brand color
className="bg-gradient-to-r from-[#your-color] to-[#your-color-dark]"
```

## 📦 Component Size

- Main component: ~8KB
- Zero external dependencies
- Uses only React built-ins
- Tailwind classes (already in bundle)

---

**Created for PulseHR** - Italian HR SaaS Platform  
Design matches existing premium design system with blue (#3b82f6) and violet (#7c3aed) accents.
