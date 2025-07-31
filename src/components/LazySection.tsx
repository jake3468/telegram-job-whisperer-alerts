import { lazy, Suspense } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

const LazySection = ({ 
  children, 
  fallback = <div className="h-32 bg-transparent" />, // Minimal fallback
  className = "",
  threshold = 0.05, // More sensitive trigger
  rootMargin = "200px" // Load earlier
}: LazySectionProps) => {
  const { ref, isIntersecting } = useIntersectionObserver({ 
    threshold, 
    rootMargin,
    triggerOnce: true 
  });

  return (
    <div ref={ref as any} className={className}>
      {isIntersecting ? children : fallback}
    </div>
  );
};

export default LazySection;