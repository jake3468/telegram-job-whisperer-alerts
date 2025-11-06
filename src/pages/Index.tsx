
import AuthHeader from "@/components/AuthHeader";
import HeroSection from "@/components/HeroSection";
// import ComparisonSlider from "@/components/ComparisonSlider";

import AboutUsSection from "@/components/AboutUsSection";
import ToolsSection from "@/components/ToolsSection";
import ComparisonTable from "@/components/ComparisonTable";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
// Temporarily disable SecurityHeaders for debugging
// import SecurityHeaders from "@/components/SecurityHeaders";
import { useEffect } from "react";
import { HeroSkeleton } from '@/components/ui/skeleton';
import { useProgressiveAuth } from '@/hooks/useProgressiveAuth';
import { useScrollTracking } from '@/hooks/useScrollTracking';
import { Environment } from '@/utils/environment';

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
    // Silently ignore unrecognized origins to avoid console spam
  }, false);
};

const Index = () => {
  const { shouldRender, showSkeleton } = useProgressiveAuth();
  
  // Track scroll depth for all sections
  useScrollTracking();
  
  useEffect(() => {
    // Suppress external postMessage errors
    suppressExternalPostMessageErrors();
    
    // Filter console noise in development/preview environments
    if (Environment.isLovablePreview() || Environment.isDevelopment()) {
      const originalWarn = console.warn.bind(console);
      const originalError = console.error.bind(console);

      const shouldSilence = (firstArg: any) => {
        if (typeof firstArg !== 'string') return false;
        return (
          firstArg.includes('Unrecognized postMessage origin') ||
          (firstArg.includes('postMessage') && firstArg.includes('lovable.app')) ||
          firstArg.includes('Understand this warning')
        );
      };

      console.warn = (...args: any[]) => {
        if (shouldSilence(args[0])) return;
        originalWarn(...args);
      };
      console.error = (...args: any[]) => {
        if (shouldSilence(args[0])) return;
        originalError(...args);
      };

      // Cleanup function to restore original console methods
      return () => {
        console.warn = originalWarn;
        console.error = originalError;
      };
    }
    
    // Add comprehensive structured data for better Google crawlability
    const structuredData = [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Aspirely AI",
        "url": window.location.origin,
        "description": "Find your next job effortlessly with Aspirely's AI agents. Get daily job alerts, tailored resumes, and mock phone interviews for a stress-free, personalized job hunt",
        "privacyPolicy": `${window.location.origin}/privacy-policy`,
        "termsOfService": `${window.location.origin}/terms-of-service`,
        "publisher": {
          "@type": "Organization",
          "name": "Aspirely AI",
          "url": window.location.origin
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": window.location.origin
          }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "AI Job Search Platform",
        "provider": {
          "@type": "Organization",
          "name": "Aspirely AI"
        },
        "areaServed": "Worldwide",
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Job Search Services",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "AI Job Alerts",
                "description": "Personalized job alerts delivered via Telegram with instant application files"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "AI Resume Builder",
                "description": "Chat-based ATS-friendly resume creation"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "AI Interview Preparation",
                "description": "Phone-based mock interviews with AI coaching"
              }
            }
          ]
        }
      }
    ];
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(structuredData);
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Show skeleton only during very brief auth loading
  if (showSkeleton) {
    return <HeroSkeleton />;
  }

  // Render immediately for professional experience
  return (
    <div className="min-h-screen bg-background font-inter text-foreground">
      {/* Skip Navigation Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      <AuthHeader />
      <main id="main-content" role="main">
        <HeroSection />
        <AboutUsSection />
        <ToolsSection />
        
        {/* Elfsight Testimonials Slider */}
        <section id="testimonials" className="relative py-8 bg-background" aria-labelledby="testimonials-heading">
          <div className="max-w-7xl mx-auto z-20 relative w-full px-4">
            <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold text-center text-foreground mb-8 font-inter">What Our Users Say</h2>
            <div className="elfsight-app-4951d48f-0df4-4724-a25f-ace7b5dfeb22" data-elfsight-app-lazy></div>
          </div>
        </section>
        
        <ComparisonTable />
        <HowItWorksSection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
