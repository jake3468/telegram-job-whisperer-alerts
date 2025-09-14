// Critical CSS extraction and inlining for above-the-fold content
export const inlineCriticalCSS = () => {
  // Critical CSS for above-the-fold content - manually extracted and optimized
  const criticalCSS = `
    /* Critical CSS - Above the fold only */
    .hero-gradient { 
      background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)));
    }
    
    .hero-text {
      background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .auth-header {
      backdrop-filter: blur(10px);
      background: hsl(var(--background) / 0.8);
    }
    
    .hero-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding: 2rem 1rem;
    }
    
    /* Critical animations */
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-hero {
      animation: fade-in-up 0.6s ease-out;
    }
  `;

  // Create and inject critical CSS
  const style = document.createElement('style');
  style.id = 'critical-css';
  style.textContent = criticalCSS;
  
  // Insert before any existing stylesheets
  const firstLink = document.head.querySelector('link[rel="stylesheet"]');
  if (firstLink) {
    document.head.insertBefore(style, firstLink);
  } else {
    document.head.appendChild(style);
  }
};

// Preload critical fonts with optimal loading strategy
export const preloadCriticalFonts = () => {
  const fontPreloads = [
    {
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      crossorigin: 'anonymous'
    }
  ];

  fontPreloads.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = font.href;
    link.crossOrigin = font.crossorigin;
    
    // Add onload to apply the stylesheet
    link.onload = function() {
      const linkElement = this as HTMLLinkElement;
      linkElement.onload = null;
      linkElement.rel = 'stylesheet';
    };
    
    document.head.appendChild(link);
    
    // Fallback for browsers that don't support preload
    const noscript = document.createElement('noscript');
    const fallbackLink = document.createElement('link');
    fallbackLink.rel = 'stylesheet';
    fallbackLink.href = font.href;
    noscript.appendChild(fallbackLink);
    document.head.appendChild(noscript);
  });
};