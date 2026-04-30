/**
 * Root layout for PulseHR.
 *
 * Global providers live here.
 * Authenticated page framing is handled by AppShell.
 */
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { SWRProvider } from "@/components/swr-provider";
import { PWARegister } from "@/components/pwa/pwa-provider";
import { Toaster } from "sonner";

export const metadata = {
  title: "PulseHR Platform",
  description: "Modern multi-tenant HR SaaS platform for companies",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PulseHR",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "theme-color": "#2563EB",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

const themeScript = `
(() => {
  const storedTheme = window.localStorage.getItem("hr_theme") || "system";
  const resolvedTheme =
    storedTheme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : storedTheme;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.style.colorScheme = resolvedTheme;
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <SWRProvider>
              {children}
              <Toaster richColors position="top-right" />
              <PWARegister />
            </SWRProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
