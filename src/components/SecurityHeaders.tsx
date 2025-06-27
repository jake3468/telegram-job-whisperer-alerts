
import { useEffect } from 'react';
import { Environment } from '@/utils/environment';

const SecurityHeaders = () => {
  useEffect(() => {
    // Only apply security headers in production
    if (!Environment.isProduction()) {
      return;
    }

    // Set security headers via meta tags for client-side
    const setMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Content Security Policy
    setMetaTag('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.aspirely.ai https://*.clerk.accounts.dev https://*.googletagmanager.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://fnzloyyhzhrqsvslhhri.supabase.co https://ipapi.co https://api.ipify.org https://ipwhois.app https://clerk.aspirely.ai;"
    );

    // X-Frame-Options
    setMetaTag('X-Frame-Options', 'DENY');

    // X-Content-Type-Options
    setMetaTag('X-Content-Type-Options', 'nosniff');

    // Referrer Policy
    setMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    setMetaTag('Permissions-Policy', 
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()'
    );

  }, []);

  return null; // This component doesn't render anything
};

export default SecurityHeaders;
