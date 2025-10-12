import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import AuthHeader from '@/components/AuthHeader';

const CookiePolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <AuthHeader showSectionNav={false} />
      <Helmet>
        <title>Cookie Policy - Aspirely.ai | How We Use Cookies</title>
        <meta name="description" content="Learn about how Aspirely.ai uses cookies to improve your experience. Detailed information about cookie types, purposes, and your rights under EU and UK GDPR." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://aspirely.ai/cookie-policy" />
        <meta property="og:title" content="Cookie Policy - Aspirely.ai" />
        <meta property="og:description" content="Comprehensive cookie policy explaining how we use cookies and your choices under EU and UK GDPR." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://aspirely.ai/cookie-policy" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Cookie Policy",
            "description": "Aspirely.ai Cookie Policy explaining cookie usage and user rights under EU and UK GDPR",
            "url": "https://aspirely.ai/cookie-policy",
            "isPartOf": {
              "@type": "WebSite",
              "name": "Aspirely.ai",
              "url": "https://aspirely.ai"
            },
            "dateModified": new Date().toISOString(),
            "publisher": {
              "@type": "Organization",
              "name": "Aspirely.ai"
            }
          })}
        </script>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-12 pt-32">

        <div className="space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 dark:from-cyan-300 dark:to-cyan-200 bg-clip-text text-transparent mb-4">
              Cookie Policy
            </h1>
            <p className="text-gray-700 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert prose-cyan max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. What Are Cookies</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Under EU GDPR, UK GDPR, and the Privacy and Electronic Communications Regulations (PECR), we are required to obtain your consent for non-essential cookies and provide you with clear information about how we use them.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">2.1 Necessary Cookies</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These cookies are essential for the website to function properly and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services.
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>Authentication cookies:</strong> Keep you logged in during your session</li>
                <li><strong>Security cookies:</strong> Protect against fraudulent activity</li>
                <li><strong>Load balancing cookies:</strong> Ensure proper website functionality</li>
                <li><strong>Cookie consent preferences:</strong> Remember your cookie choices</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">2.2 Analytics Cookies</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>Google Analytics:</strong> Tracks page views, user sessions, and site usage patterns</li>
                <li><strong>Performance monitoring:</strong> Helps identify and fix technical issues</li>
                <li><strong>Feature usage:</strong> Understand which features are most popular</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">2.3 Functional Cookies</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These cookies enable enhanced functionality and personalisation, such as remembering your preferences.
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>Theme preferences:</strong> Remember if you prefer light or dark mode</li>
                <li><strong>Language settings:</strong> Store your preferred language</li>
                <li><strong>Feature preferences:</strong> Remember your dashboard layout preferences</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">2.4 Marketing Cookies (Currently Not Used)</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                We do not currently use marketing or advertising cookies. If we decide to use them in the future, we will update this policy and seek your consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Third-Party Cookies</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Some cookies are placed by third-party services that appear on our pages:
              </p>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">3.1 Google Analytics</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li><strong>Purpose:</strong> Website analytics and performance monitoring</li>
                <li><strong>Data collected:</strong> Anonymous usage statistics, page views, session duration</li>
                <li><strong>Retention period:</strong> 26 months</li>
                <li><strong>Your control:</strong> You can opt out via our cookie banner or Google's opt-out tools</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">3.2 Clerk (Authentication Service)</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>Purpose:</strong> Secure user authentication and session management</li>
                <li><strong>Data collected:</strong> Authentication tokens, session information</li>
                <li><strong>Retention period:</strong> Until logout or session expiry</li>
                <li><strong>Legal basis:</strong> Necessary for service provision (legitimate interest)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Your Rights and Choices</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.1 Cookie Consent Management</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You can control your cookie preferences at any time:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>Use our cookie banner when you first visit the site</li>
                <li>Change your preferences in your browser settings</li>
                <li>Use browser extensions that block tracking cookies</li>
                <li>Contact us to request changes to your cookie settings</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.2 Browser Controls</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Most web browsers allow you to control cookies through their settings:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data</li>
                <li><strong>Firefox:</strong> Options &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
                <li><strong>Edge:</strong> Settings &gt; Cookies and site permissions</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.3 Withdrawing Consent</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                You can withdraw your consent for non-essential cookies at any time. This will not affect the lawfulness of processing based on consent before its withdrawal. Withdrawing consent may limit your ability to use certain features of our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Cookie Retention and Deletion</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Different cookies have different retention periods:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent cookies:</strong> Remain until their expiry date or until you delete them</li>
                <li><strong>Analytics cookies:</strong> Typically expire after 2 years</li>
                <li><strong>Consent cookies:</strong> Stored for 12 months to remember your preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Updates to This Cookie Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices or applicable laws. When we make changes, we will:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>Update the "Last updated" date at the top of this policy</li>
                <li>Notify users of significant changes via our website or email</li>
                <li>Seek fresh consent where required by law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <ul className="list-none text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>Email:</strong> support@aspirely.ai</li>
                <li><strong>Website:</strong> <a href="/contact-support" className="text-primary hover:underline">Contact Support</a></li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">Data Protection Authorities</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you are not satisfied with our response to your cookie-related concerns, you have the right to lodge a complaint with your local data protection authority:
              </p>
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">For EU Users:</p>
                <ul className="list-none text-gray-700 dark:text-gray-300 space-y-1 mb-4 ml-4">
                  <li><strong>Find your local authority:</strong> <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">European Data Protection Board</a></li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">For UK Users:</p>
                <ul className="list-none text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                  <li><strong>Website:</strong> <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ico.org.uk</a></li>
                  <li><strong>Phone:</strong> 0303 123 1113</li>
                  <li><strong>Address:</strong> Information Commissioner's Office, Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;