
import AuthHeader from "@/components/AuthHeader";
import OptimizedHeroSection from "@/components/OptimizedHeroSection";
import { useEffect, Suspense, lazy } from "react";
import { HeroSkeleton } from '@/components/ui/skeleton';
import { useProgressiveAuth } from '@/hooks/useProgressiveAuth';

// Lazy load non-critical sections
const AboutUsSection = lazy(() => import("@/components/AboutUsSection"));
const ToolsSection = lazy(() => import("@/components/ToolsSection"));
const HowItWorksSection = lazy(() => import("@/components/HowItWorksSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const Footer = lazy(() => import("@/components/Footer"));

// Global postMessage error handler to suppress external service errors
const suppressExternalPostMessageErrors = () => {
  window.addEventListener('message', (event) => {
    // List of known external origins that might cause postMessage errors
    const allowedOrigins = [
      'https://startupfa.me',
      'https://findly.tools', 
      'https://turbo0.com',
      'https://twelve.tools',
      'https://fazier.com'
    ];
    
    // Only suppress errors from known external services
    if (!allowedOrigins.some(origin => event.origin.includes(origin))) {
      console.warn('Unrecognized postMessage origin:', event.origin);
    }
  }, false);
};

const Index = () => {
  const { shouldRender, showSkeleton } = useProgressiveAuth();
  useEffect(() => {
    // Suppress external postMessage errors
    suppressExternalPostMessageErrors();
    
    // Add JSON-LD structured data for better Google crawlability
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Aspirely.ai",
      "url": window.location.origin,
      "description": "The AI-powered platform for finding and creating your perfect career path with advanced job matching and personalized guidance.",
      "privacyPolicy": `${window.location.origin}/privacy-policy`,
      "termsOfService": `${window.location.origin}/terms-of-service`,
      "publisher": {
        "@type": "Organization",
        "name": "Aspirely.ai",
        "url": window.location.origin
      }
    });
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Show skeleton only during very brief auth loading
  if (showSkeleton) {
    return <HeroSkeleton />;
  }

  // Render optimized version with lazy loading
  return (
    <div className="min-h-screen bg-background font-inter text-foreground">
      <AuthHeader />
      <OptimizedHeroSection />
      
      {/* Lazy load below-the-fold content */}
      <Suspense fallback={<div className="h-32 bg-muted animate-pulse" />}>
        <AboutUsSection />
      </Suspense>
      
      <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
        <ToolsSection />
      </Suspense>
      
      <Suspense fallback={<div className="h-32 bg-muted animate-pulse" />}>
        <HowItWorksSection />
      </Suspense>
      
      <div id="pricing">
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
          <PricingSection />
        </Suspense>
      </div>
      
      <div id="faq">
        <Suspense fallback={<div className="h-48 bg-muted animate-pulse" />}>
          <FAQSection />
        </Suspense>
      </div>
      
      <Suspense fallback={<div className="h-32 bg-muted animate-pulse" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
