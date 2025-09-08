interface HandDrawnArrowProps {
  className?: string;
  direction?: 'left' | 'down-right';
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
            d="M110 30C105 25 95 20 85 22C75 24 65 28 55 30C45 32 35 30 25 28C20 27 15 25 12 20C10 17 9 14 8 12" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
          />
          <path 
            d="M15 12L8 12L8 19" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
          />
        </svg>
      ) : (
        // Mobile arrow pointing down-right
        <svg 
          width="80" 
          height="80" 
          viewBox="0 0 80 80" 
          fill="none" 
          className="text-foreground"
        >
          <path 
            d="M20 15C25 20 30 25 35 32C40 39 45 46 50 52C55 58 60 62 65 65" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
          />
          <path 
            d="M58 65L65 65L65 58" 
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