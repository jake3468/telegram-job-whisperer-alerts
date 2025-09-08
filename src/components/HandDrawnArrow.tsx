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
        // Mobile arrow pointing up to video - wiggly style
        <svg 
          width="90" 
          height="90" 
          viewBox="0 0 90 90" 
          fill="none" 
          className="text-foreground"
        >
          <path 
            d="M45 80C42 75 38 70 42 65C46 60 50 55 46 50C42 45 38 40 42 35C46 30 50 25 48 20C46 15 44 10 45 5" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
          />
          <path 
            d="M40 10L45 5" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
          />
          <path 
            d="M50 10L45 5" 
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