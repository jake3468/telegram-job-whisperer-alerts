interface HandDrawnArrowProps {
  className?: string;
  direction?: 'left' | 'up';
}

const HandDrawnArrow = ({ className, direction = 'left' }: HandDrawnArrowProps) => {
  return (
    <div className={className}>
      {direction === 'left' ? (
        // Desktop arrow pointing left to YouTube video
        <svg 
          width="120" 
          height="60" 
          viewBox="0 0 120 60" 
          fill="none" 
          className="text-foreground"
        >
          <path 
            d="M110 30C105 35 95 25 85 32C75 28 65 35 55 30C45 25 35 35 25 30C20 28 15 32 12 30C10 28 9 32 8 30" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
          />
          <path 
            d="M15 25L8 30L15 35" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
          />
        </svg>
      ) : (
        // Mobile arrow pointing up to video
        <svg 
          width="80" 
          height="80" 
          viewBox="0 0 80 80" 
          fill="none" 
          className="text-foreground"
        >
          <path 
            d="M40 65C45 60 50 55 45 48C40 41 35 34 40 27C45 20 50 15 55 12" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
          />
          <path 
            d="M50 17L55 12L60 17" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
          />
        </svg>
      )}
    </div>
  );
};

export default HandDrawnArrow;