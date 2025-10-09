import React from 'react';
import { Helmet } from 'react-helmet-async';

export const BadgeVerification: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Aspirely.ai - Badge Verification</title>
        <meta name="description" content="Verification page for Aspirely.ai badges and features" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Aspirely.ai - AI Career Platform" />
        <meta property="og:description" content="AI-powered career advancement platform for job seekers" />
        <meta property="og:url" content="https://aspirely.ai" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://aspirely.ai" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Aspirely.ai",
            "url": "https://aspirely.ai",
            "description": "AI-powered career advancement platform for job seekers",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Aspirely.ai"
            },
            "award": [
              {
                "@type": "Award",
                "name": "Featured on Startup Fame",
                "url": "https://startupfa.me/startup/aspirely-ai"
              },
              {
                "@type": "Award", 
                "name": "Featured on Findly Tools",
                "url": "https://findly.tools/aspirely-ai"
              }
            ]
          })}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-bold text-foreground">
            Aspirely.ai - Badge Verification
          </h1>
          
          <p className="text-lg text-muted-foreground">
            AI-powered career advancement platform for job seekers
          </p>
          
          <div className="grid gap-6 mt-8">
            <div className="p-6 border rounded-lg bg-card">
              <h2 className="text-xl font-semibold mb-4">Featured On</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded">
                  <span>Startup Fame</span>
                  <a 
                    href="https://startupfa.me/startup/aspirely-ai" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    data-verification="startup-fame"
                  >
                    View Listing
                  </a>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted rounded">
                  <span>Findly Tools</span>
                  <a 
                    href="https://findly.tools/aspirely-ai" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    data-verification="findly-tools"
                  >
                    View Listing
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-muted-foreground">
              This page is designed for verification bots and badge services.{' '}
              <a href="/" className="text-primary hover:underline">
                Return to main site
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};