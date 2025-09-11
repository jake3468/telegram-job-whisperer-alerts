import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
const PrivacyPolicy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return <div className="min-h-screen bg-background text-foreground font-inter">
      <Helmet>
        <title>Privacy Policy - Aspirely.ai | AI-Powered Job Hunting Platform</title>
        <meta name="description" content="Aspirely.ai Privacy Policy - Learn how we collect, use, and protect your data in our AI-powered job hunting platform. Comprehensive data handling and user rights information." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://aspirely.ai/privacy-policy" />
        <meta property="og:title" content="Privacy Policy - Aspirely.ai" />
        <meta property="og:description" content="Comprehensive privacy policy for Aspirely.ai covering data collection, Google OAuth integration, and user rights." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://aspirely.ai/privacy-policy" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Privacy Policy",
            "description": "Aspirely.ai Privacy Policy covering data collection, Google user data handling, and user rights",
            "url": "https://aspirely.ai/privacy-policy",
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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-800 dark:text-cyan-300 hover:text-gray-900 dark:hover:text-cyan-200 transition-colors mb-8">
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <div className="space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 dark:from-cyan-300 dark:to-cyan-200 bg-clip-text text-transparent mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-700 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-gray dark:prose-invert prose-cyan max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Welcome to Aspirely.ai ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our AI-powered job hunting services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Aspirely.ai is committed to protecting your privacy and ensuring transparency about our data practices. As an AI-powered platform that helps job seekers with personalized career tools, we understand the sensitivity of the information you share with us and take our responsibility to protect it seriously.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">We collect the following types of personal information:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>Contact Information:</strong> Email addresses, names, and other contact details</li>
                <li><strong>Professional Information:</strong> Resume content, work experience, education details, skills, and job preferences</li>
                <li><strong>Location Data:</strong> Geographic location information for personalized job alerts and location-based pricing</li>
                <li><strong>Payment Information:</strong> Billing details and payment method information (processed securely through our payment processor)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">2.2 Google User Data Collection</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">When you sign in with Google OAuth, we collect the following Google user data:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>Basic Profile Information:</strong> Your name, email address, and profile picture from your Google account</li>
                <li><strong>Google Account ID:</strong> Unique identifier from Google to manage your account authentication</li>
                <li><strong>Email Verification Status:</strong> Whether your Google email is verified to ensure account security</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                <strong>Important:</strong> We only request the minimum necessary Google user data required for authentication and account creation. We do not access your Google Drive, Gmail, Calendar, or any other Google services beyond basic profile information.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">2.3 Generated Content</h3>
              <p className="text-gray-700 dark:text-gray-300">
                We store the content generated through our AI tools, including cover letters, interview preparation materials, LinkedIn posts, and job analyses, to provide you with access to your history and improve our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">We use the collected information for the following purposes:</p>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">3.1 Google User Data Usage</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">We use Google user data specifically and exclusively for:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>Account Authentication:</strong> To securely sign you into your Aspirely.ai account</li>
                <li><strong>Account Creation:</strong> To create and maintain your user profile on our platform</li>
                <li><strong>Communication:</strong> To send you service-related notifications using your Google email address</li>
                <li><strong>User Identification:</strong> To personalize your experience and maintain your account across sessions</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                <strong>We do NOT use Google user data for:</strong> advertising, selling to third parties, determining creditworthiness, lending purposes, or any purposes unrelated to providing our core job hunting services.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">3.2 Service Delivery</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>Generate personalized cover letters using Claude (by Anthropic)</li>
                <li>Create tailored interview preparation materials using Claude (by Anthropic)</li>
                <li>Provide job analysis and company insights using OpenAI and Perplexity AI</li>
                <li>Deliver personalized job alerts via Telegram using RapidAPI and OpenAI</li>
                <li>Generate LinkedIn content using Perplexity and OpenAI</li>
                <li>Provide resume building and updating services through our Telegram bot using OpenAI</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">3.3 Platform Operations</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>Process payments and manage subscriptions through DodoPayments</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send service-related notifications and updates</li>
                <li>Maintain and improve our platform's functionality</li>
                <li>Ensure security and prevent fraud</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">3.4 Personalization and Analytics</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>Analyze usage patterns to improve our AI models</li>
                <li>Customize your experience based on preferences</li>
                <li>Develop new features and services</li>
                <li>Generate aggregated, non-identifiable statistics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.1 Google User Data Sharing</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>We do NOT share, transfer, or disclose your Google user data to any third parties.</strong> Your Google profile information remains secure within our platform and is only used for the purposes outlined in Section 3.1 above.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                <strong>We do NOT sell your Google user data.</strong> We are committed to protecting your privacy and will never monetize your Google account information.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.2 Third-Party AI Services</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">To provide our core services, we share your data with the following service providers under strict data processing agreements:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>OpenAI:</strong> For job analysis, job alerts personalization, LinkedIn content generation, and resume bot functionality</li>
                <li><strong>Anthropic (Claude):</strong> For cover letter generation and interview preparation materials</li>
                <li><strong>Perplexity AI:</strong> For company analysis and LinkedIn content research</li>
                <li><strong>RapidAPI:</strong> For job searching and aggregation services</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                <strong>Important:</strong> We do not share your Google user data with these AI service providers. Only job-related content and professional information you explicitly provide is shared with these services for processing.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.3 Workflow Automation</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use n8n for workflow automation, which may process your data to coordinate between different services and deliver seamless experiences.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.4 Communication Platforms</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use Telegram to deliver job alerts and provide resume bot services. Your interaction data with these bots is processed to provide personalized responses.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.5 Payment Processing</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Payment information is processed by DodoPayments, our secure payment processor. We do not store complete payment card information on our servers.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.6 Legal Requirements</h3>
              <p className="text-gray-700 dark:text-gray-300">
                We may disclose your information if required by law, legal process, or to protect the rights, property, or safety of Aspirely.ai, our users, or others.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Data Retention and Deletion</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">5.1 Google User Data Retention</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We retain your Google user data (name, email, profile picture, and account ID) only for as long as your Aspirely.ai account remains active. When you:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li><strong>Delete your account:</strong> Your Google user data is immediately removed from our active systems</li>
                <li><strong>Disconnect Google OAuth:</strong> We will delete your Google profile information within 24 hours</li>
                <li><strong>Request data deletion:</strong> We will delete your Google user data within 48 hours of your request</li>
              </ul>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">5.2 General Data Retention</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                For other personal information, we retain your data for as long as your account remains active or as needed to provide you services. When you delete your account, we will:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Delete your personal information from our active databases within 30 days</li>
                <li>Remove your generated content (cover letters, interview prep materials, etc.)</li>
                <li>Anonymize any remaining data used for analytics purposes</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                Some information may be retained in backup systems for up to 90 days for security and recovery purposes, after which it will be permanently deleted.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Data Security</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">6.1 Google User Data Protection</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement enhanced security measures specifically for Google user data:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li><strong>OAuth 2.0 Secure Authentication:</strong> Using Google's secure OAuth 2.0 protocol for authentication</li>
                <li><strong>Encrypted Storage:</strong> Your Google user data is encrypted both in transit and at rest</li>
                <li><strong>Access Controls:</strong> Limited access to Google user data only for essential account functions</li>
                <li><strong>No Third-Party Sharing:</strong> Google user data is never shared with external services</li>
                <li><strong>Regular Security Audits:</strong> Continuous monitoring for unauthorized access attempts</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">6.2 General Security Measures</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement industry-standard security measures to protect all your information:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Encryption of data in transit and at rest using AES-256 encryption</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Multi-factor authentication and access controls</li>
                <li>Secure API integrations with third-party services</li>
                <li>Regular backups and disaster recovery procedures</li>
                <li>Secure hosting infrastructure with DDoS protection</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but continuously work to improve our security measures.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Your Rights and Choices</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">7.1 Access and Control</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>Access and review your personal information</li>
                <li>Update or correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of non-essential communications</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">7.2 Communication Preferences</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You can manage your communication preferences, including job alerts frequency and promotional emails, through your account settings or by contacting us directly.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">7.3 Content Ownership</h3>
              <p className="text-gray-700 dark:text-gray-300">
                You retain ownership of all content generated through our platform, including cover letters, resumes, and other materials. You can download and use this content freely.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. UK GDPR Compliance and Lawful Basis</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">8.1 Lawful Basis for Processing</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Under UK GDPR, we process your personal data based on the following lawful bases:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>Consent (Article 6(1)(a)):</strong> For marketing communications, analytics cookies, and optional features</li>
                <li><strong>Contract (Article 6(1)(b)):</strong> To provide our AI-powered job hunting services as agreed in our Terms of Service</li>
                <li><strong>Legitimate Interest (Article 6(1)(f)):</strong> For security, fraud prevention, and improving our services</li>
                <li><strong>Legal Obligation (Article 6(1)(c)):</strong> To comply with legal requirements such as data protection laws and financial regulations</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">8.2 Special Categories of Data</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do not intentionally collect special categories of personal data (sensitive data such as health, race, religious beliefs). If such information is inadvertently included in your resume or other content, we process it only with your explicit consent and for the purpose of providing our services.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">8.3 Data Protection Officer</h3>
              <p className="text-gray-700 dark:text-gray-300">
                While not legally required due to our size, we have designated a Data Protection Contact for privacy-related inquiries. You can reach them at privacy@aspirely.ai.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Your Rights Under UK GDPR</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">9.1 Individual Rights</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Under UK GDPR, you have the following rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-3 mb-6">
                <li><strong>Right of Access (Article 15):</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Right to Rectification (Article 16):</strong> Correct inaccurate or incomplete personal data</li>
                <li><strong>Right to Erasure (Article 17):</strong> Request deletion of your personal data in certain circumstances</li>
                <li><strong>Right to Restrict Processing (Article 18):</strong> Limit how we use your personal data in specific situations</li>
                <li><strong>Right to Data Portability (Article 20):</strong> Receive your personal data in a structured, commonly used format</li>
                <li><strong>Right to Object (Article 21):</strong> Object to processing based on legitimate interests or for direct marketing</li>
                <li><strong>Rights Related to Automated Decision-Making (Article 22):</strong> Request human review of automated decisions that significantly affect you</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">9.2 How to Exercise Your Rights</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To exercise any of your rights, please contact us at privacy@aspirely.ai. We will:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>Respond to your request within 30 days (or explain if more time is needed)</li>
                <li>Verify your identity before processing the request</li>
                <li>Provide the requested information free of charge (unless the request is manifestly unfounded or excessive)</li>
                <li>Inform you if we cannot comply with your request and explain why</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">9.3 Complaints and ICO Contact</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you are not satisfied with how we handle your personal data or privacy concerns, you have the right to lodge a complaint with the UK's supervisory authority:
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                <p className="text-blue-900 dark:text-blue-100 font-medium mb-3">Information Commissioner's Office (ICO)</p>
                <ul className="list-none text-blue-800 dark:text-blue-200 space-y-1">
                  <li><strong>Website:</strong> <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="underline">ico.org.uk</a></li>
                  <li><strong>Phone:</strong> 0303 123 1113</li>
                  <li><strong>Email:</strong> <a href="mailto:casework@ico.org.uk" className="underline">casework@ico.org.uk</a></li>
                  <li><strong>Address:</strong> Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                As we use various third-party AI services and tools, your data may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and that adequate safeguards are in place.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Our third-party processors, including OpenAI, Anthropic, and others, have their own privacy policies and data protection measures. We recommend reviewing their policies to understand how they handle your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Children's Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300">
                While we do not have specific age restrictions, our services are designed for job seekers and professionals. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Posting the updated policy on our website</li>
                <li>Sending an email notification to registered users</li>
                <li>Displaying a prominent notice on our platform</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                Your continued use of our services after the effective date of the updated Privacy Policy constitutes acceptance of the changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">13. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg border border-gray-300 dark:border-gray-800 mb-6">
                <p className="text-gray-900 dark:text-white font-medium mb-2">Aspirely.ai Privacy Team</p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">Email: privacy@aspirely.ai</p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">General Support: support@aspirely.ai</p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">Response Time: Within 30 days for data requests, 48 hours for general inquiries</p>
                <p className="text-gray-700 dark:text-gray-300">
                  For urgent privacy-related matters, please mark your email subject with "URGENT - Privacy Request"
                </p>
              </div>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">Alternative Contact Methods</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You can also reach us through our <a href="/contact-support" className="text-primary hover:underline">Contact Support page</a> for privacy-related inquiries.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">14. Effective Date</h2>
              <p className="text-gray-700 dark:text-gray-300">
                This Privacy Policy is effective as of {new Date().toLocaleDateString()} and applies to all information collected by Aspirely.ai on or after this date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>;
};
export default PrivacyPolicy;