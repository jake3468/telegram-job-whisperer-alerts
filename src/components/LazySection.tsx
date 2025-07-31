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
  fallback = <div className="h-96 animate-pulse bg-gray-100 rounded-lg" />, 
  className = "",
  threshold = 0.1,
  rootMargin = "100px"
}: LazySectionProps) => {
  const { ref, isIntersecting } = useIntersectionObserver({ 
    threshold, 
    rootMargin,
    triggerOnce: true 
  });

  return (
    <div ref={ref as any} className={className}>
      {isIntersecting ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
};

export default LazySection;