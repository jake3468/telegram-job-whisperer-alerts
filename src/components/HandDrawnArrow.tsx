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
            d="M110 30C105 30 95 28 85 29C75 30 65 32 55 30C45 28 35 30 25 30C20 30 15 29 12 30C10 30 9 30 8 30" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
          />
          <path 
            d="M15 30L8 30L8 23" 
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
            d="M40 65C35 60 30 55 35 48C40 41 45 34 40 27C35 20 30 15 25 12" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
          />
          <path 
            d="M25 19L25 12L32 12" 
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