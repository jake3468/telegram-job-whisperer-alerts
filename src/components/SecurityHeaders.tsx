
import { useEffect } from 'react';
import { Environment } from '@/utils/environment';
import { cspManager } from '@/utils/contentSecurityPolicy';

const SecurityHeaders = () => {
  useEffect(() => {
    // Apply Content Security Policy
    cspManager.applyCSPMeta();

    // Set additional security headers via meta tags
    const setMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const setHttpEquivTag = (httpEquiv: string, content: string) => {
      let meta = document.querySelector(`meta[http-equiv="${httpEquiv}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.httpEquiv = httpEquiv;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // X-Frame-Options
    setHttpEquivTag('X-Frame-Options', 'SAMEORIGIN');

    // X-Content-Type-Options
    setHttpEquivTag('X-Content-Type-Options', 'nosniff');

    // X-XSS-Protection
    setHttpEquivTag('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    setMetaTag('referrer', 'strict-origin-when-cross-origin');

    // Permissions Policy
    setHttpEquivTag('Permissions-Policy', 
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), ' +
      'magnetometer=(), gyroscope=(), speaker=(), fullscreen=(self), ' +
      'picture-in-picture=()'
    );

    // Strict Transport Security (HSTS) - only in production
    if (Environment.isProduction()) {
      setHttpEquivTag('Strict-Transport-Security', 
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Feature Policy for additional security
    setHttpEquivTag('Feature-Policy', 
      "accelerometer 'none'; ambient-light-sensor 'none'; autoplay 'none'; " +
      "battery 'none'; camera 'none'; display-capture 'none'; " +
      "document-domain 'none'; encrypted-media 'none'; execution-while-not-rendered 'none'; " +
      "execution-while-out-of-viewport 'none'; fullscreen 'self'; " +
      "geolocation 'none'; gyroscope 'none'; layout-animations 'none'; " +
      "legacy-image-formats 'none'; magnetometer 'none'; microphone 'none'; " +
      "midi 'none'; navigation-override 'none'; payment 'none'; " +
      "picture-in-picture 'none'; publickey-credentials-get 'none'; " +
      "speaker-selection 'none'; sync-xhr 'none'; unoptimized-images 'none'; " +
      "unsized-media 'none'; usb 'none'; screen-wake-lock 'none'; " +
      "web-share 'none'; xr-spatial-tracking 'none';"
    );

  }, []);

  return null;
};

export default SecurityHeaders;
