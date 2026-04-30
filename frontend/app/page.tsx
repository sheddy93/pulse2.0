/**
 * PulseHR Landing Page
 * 
 * Professional SaaS HR platform landing page with:
 * - Animated sections with fade-in effects
 * - Tabbed dashboard preview (placeholder for real screenshots)
 * - Feature cards with hover animations
 * - Real product stats (no fake numbers)
 * - Transparent pricing with billing toggle
 * - Placeholder testimonials (no fake data)
 * - FAQ accordion
 * - Professional footer with trust badges
 * 
 * Anti-fake policy:
 * - NO invented user counts
 * - NO fake testimonials
 * - NO invented awards
 * - ONLY real product features
 * - ONLY real pricing from backend
 * 
 * To add real screenshots:
 * 1. Replace placeholder divs in DashboardPreview.tsx with actual <img> tags
 * 2. Place screenshots in /public/screenshots/ directory
 * 3. Update the placeholder content with your actual dashboard images
 */

import {
  Navigation,
  HeroSection,
  DashboardPreview,
  FeaturesSection,
  StatsSection,
  PricingSection,
  HowItWorksSection,
  TestimonialsSection,
  FAQSection,
  FinalCTASection,
  Footer,
} from "@/components/landing";

/**
 * Main Landing Page Component
 * Assembles all section components into the complete landing page
 */
export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section - Main value proposition with animations */}
      <HeroSection />

      {/* Dashboard Preview - Tabbed interface for different views */}
      <DashboardPreview />

      {/* Features Section - Grid of feature cards with hover effects */}
      <FeaturesSection />

      {/* Stats Section - Real product features, no fake numbers */}
      <StatsSection />

      {/* How It Works - 3 step guide + solutions per role */}
      <HowItWorksSection />

      {/* Pricing Section - Transparent pricing with billing toggle */}
      <PricingSection />

      {/* Testimonials - Placeholder (real testimonials will be added later) */}
      <TestimonialsSection />

      {/* FAQ Section - Accordion with common questions */}
      <FAQSection />

      {/* Final CTA - Strong call to action */}
      <FinalCTASection />

      {/* Footer - Professional with trust badges */}
      <Footer />
    </main>
  );
}