import { useEffect, useRef } from 'react';
import { Environment } from '@/utils/environment';

interface SectionConfig {
  id: string;
  goalName: string;
  displayName: string;
}

const SECTIONS: SectionConfig[] = [
  { id: 'hero-section', goalName: 'viewed_hero_section', displayName: 'Hero Section' },
  { id: 'about-section', goalName: 'viewed_about_section', displayName: 'About Section' },
  { id: 'features', goalName: 'viewed_tools_section', displayName: 'Tools Section' },
  { id: 'how-it-works', goalName: 'viewed_how_it_works_section', displayName: 'How It Works' },
  { id: 'pricing', goalName: 'viewed_pricing_section', displayName: 'Pricing Section' },
  { id: 'faq', goalName: 'viewed_faq_section', displayName: 'FAQ Section' },
  { id: 'footer-section', goalName: 'viewed_footer_section', displayName: 'Footer' },
];

export const useScrollTracking = () => {
  const trackedSections = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Check if DataFast is available
    if (typeof window === 'undefined' || !window.datafast) {
      if (!Environment.isProduction()) {
        console.debug('DataFast is not available for scroll tracking');
      }
      return;
    }

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5, // Trigger when 50% of section is visible
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          const section = SECTIONS.find(s => s.id === sectionId);

          // Only track once per section
          if (section && !trackedSections.current.has(sectionId)) {
            trackedSections.current.add(sectionId);

            // Calculate scroll depth percentage
            const scrollDepth = Math.round(
              (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );

            // Send goal to DataFast with metadata
            try {
              window.datafast(section.goalName, {
                section_name: section.displayName,
                scroll_depth: `${scrollDepth}%`,
                timestamp: new Date().toISOString(),
              });

              if (!Environment.isProduction()) {
                console.debug(`Tracked: ${section.displayName} at ${scrollDepth}% scroll depth`);
              }
            } catch (error) {
              console.error('Error tracking scroll goal:', error);
            }
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Observe all sections
    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    datafast?: (goalName: string, metadata?: Record<string, string>) => void;
  }
}
