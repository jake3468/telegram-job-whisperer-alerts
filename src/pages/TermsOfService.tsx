import { useEffect } from 'react';
import AuthHeader from '@/components/AuthHeader';
const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return <div className="min-h-screen bg-background text-foreground font-inter">
      <AuthHeader showSectionNav={false} />
      <div className="max-w-4xl mx-auto px-4 py-12">

        <div className="space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 dark:from-cyan-300 dark:to-cyan-200 bg-clip-text text-transparent mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-700 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-gray dark:prose-invert prose-cyan max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and Aspirely.ai ("Company," "we," "us," or "our"). By accessing or using our website, mobile application, or any of our AI-powered career services, you agree to be bound by these Terms.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                If you do not agree to these Terms, you must not access or use our services. These Terms apply to all visitors, users, and others who access or use our services.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Aspirely.ai is a comprehensive AI-powered platform featuring three intelligent Telegram AI agents and key web platform tools designed to streamline your job search through personalized job matching, resume building, application management, and interview preparation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Description of Services</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">2.1 Core Services</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">Aspirely.ai provides the following services:</p>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-gray-300 dark:border-gray-800">
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Job Alerts AI Agent</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">Personalized job matching delivered via Telegram with 7 instant files per alert, including tailored resumes, cover letters, company research, and interview preparation materials using OpenAI & Perplexity AI.</p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-gray-300 dark:border-gray-800">
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Resume Builder AI Agent</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Conversational resume building and tailoring service via Telegram bot, powered by OpenAI for personalized resume optimization and instant updates.
                  </p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-gray-300 dark:border-gray-800">
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Job Application AI Agent</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Complete application packages for specific jobs via Telegram, generating comprehensive application materials tailored to individual job postings and requirements.
                  </p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-gray-300 dark:border-gray-800">
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Job Board</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Centralized job browsing platform where Telegram job alerts are displayed and organized, allowing users to easily browse, filter, and manage job opportunities with one-click actions to add jobs to the Job Tracker.
                  </p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-gray-300 dark:border-gray-800">
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Job Tracker</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Comprehensive application management system with AI-generated tailored checklists, resume suggestions, mock interview preparation, and stage-based tracking from "Interested" to "Interviewing."
                  </p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-gray-300 dark:border-gray-800">
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-2">AI Mock Phone Call Interview with Grace</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Realistic phone-based interview practice with Grace, our AI interviewer, providing role-specific mock interviews, detailed performance reports, and personalized improvement recommendations using advanced conversation AI.
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">2.2 Service Availability</h3>
              <p className="text-gray-700 dark:text-gray-300">
                We strive to maintain high service availability but do not guarantee uninterrupted access to our services. Scheduled maintenance, updates, or technical issues may temporarily affect service availability.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. User Accounts and Registration</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To access our services, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">3.2 Account Responsibilities</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information as necessary</li>
                <li>Notify us immediately of any unauthorized access or security breaches</li>
                <li>Use your account solely for lawful purposes</li>
                <li>Not share your account credentials with third parties</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">3.3 Account Termination</h3>
              <p className="text-gray-700 dark:text-gray-300">
                You may terminate your account at any time through your account settings. We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, abusive, or illegal activities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Pricing Plans</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.1 Service Tiers</h3>
              <div className="space-y-4 mb-6">
                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-gray-300 dark:border-gray-800">
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Trial Plan</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">30 credits with access to all features. Pay once, use anytime - no subscription required.</p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-gray-300 dark:border-gray-800">
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-2">200 Credit Power Pack</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">One-time purchase of 200 credits with no expiration date, providing extensive access to all AI-powered features</p>
                </div>
              </div>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.2 Pricing and Location-Based Adjustments</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our pricing varies by geographic location to ensure fair access to our services. We automatically detect your location to provide appropriate pricing in your local currency. Prices are clearly displayed before any purchase.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.3 Payment Processing</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                All payments are processed securely through DodoPayments, our trusted payment processor. We do not store complete payment card information on our servers. By making a purchase, you agree to DodoPayments' terms and conditions.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">4.4 Credit System</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Our services operate on a credit-based system where each AI-powered feature consumes a specific number of credits. Credit usage is clearly displayed before each service use. All purchased credits do not expire, providing flexible usage over time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Refund and Cancellation Policy</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">5.1 Refund Eligibility</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We offer refunds under the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Technical issues preventing service access for more than 24 hours</li>
                <li>Double billing or processing errors</li>
                <li>Credit pack purchase within 48 hours with minimal usage</li>
                <li>Documented service failures that prevent feature utilization</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">5.2 Refund Process</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Approved refunds will be processed and returned to your original payment method within 48 hours of approval. Contact our support team at support@aspirely.ai to initiate a refund request.
              </p>

            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">6.1 Permitted Uses</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">You may use our services for:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>Personal job searching and career development activities</li>
                <li>Creating professional documents and content</li>
                <li>Research and analysis of career opportunities</li>
                <li>Professional networking and personal branding</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">6.2 Prohibited Uses</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">You may not use our services to:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>Create false, misleading, or fraudulent content</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon intellectual property rights of others</li>
                <li>Spam, harass, or send unsolicited communications</li>
                <li>Attempt to reverse engineer or access our systems unauthorized</li>
                <li>Use automated scripts or bots to abuse our services</li>
                <li>Share account credentials or resell access to our services</li>
                <li>Generate content that is discriminatory, hateful, or offensive</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">6.3 Content Responsibility</h3>
              <p className="text-gray-700 dark:text-gray-300">
                While our AI tools generate content based on your inputs, you are responsible for reviewing, editing, and ensuring the accuracy and appropriateness of all generated content before use in professional contexts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">7.1 Your Content Ownership</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You retain full ownership of all content generated through our platform, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>Cover letters and professional documents</li>
                <li>Resume content and variations</li>
                <li>LinkedIn posts and social media content</li>
                <li>Interview preparation materials</li>
                <li>Job analysis reports and insights</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">7.2 Platform Rights</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Aspirely.ai retains all rights to our platform, technology, algorithms, and proprietary systems. This includes our AI models, user interface, branding, and underlying software infrastructure.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">7.3 Third-Party AI Services</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Our services utilize third-party AI providers (OpenAI, Anthropic, Perplexity) that have their own terms of service and intellectual property policies. By using our services, you acknowledge and agree to comply with these third-party terms where applicable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Privacy and Data Protection</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your privacy is important to us. Our comprehensive Privacy Policy, which is incorporated by reference into these Terms, explains how we collect, use, and protect your information. Key points include:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>We collect only necessary information to provide our services</li>
                <li>Your data is shared with AI providers solely for service delivery</li>
                <li>You can delete your account and data at any time</li>
                <li>We implement industry-standard security measures</li>
                <li>Premium users receive priority support for data-related requests</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                Please review our complete Privacy Policy for detailed information about our data practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Service Disclaimers and Limitations</h2>
              
              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">9.1 No Employment Guarantees</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Aspirely.ai does not guarantee job placement, interview success, or any specific career outcomes. Our services are designed to assist and enhance your job search efforts, but success depends on numerous factors beyond our control.
              </p>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">9.2 AI-Generated Content Limitations</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                While our AI tools are sophisticated, they may occasionally produce:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>Inaccurate or outdated information</li>
                <li>Content requiring human review and editing</li>
                <li>Results that vary in quality based on input data</li>
                <li>Responses that may not perfectly match your expectations</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">9.3 Service Availability</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do not guarantee continuous, uninterrupted, or error-free service availability. Factors that may affect service include:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Scheduled maintenance and updates</li>
                <li>Third-party AI service limitations or outages</li>
                <li>High demand periods affecting response times</li>
                <li>Technical issues beyond our control</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 dark:text-sky-400 mb-3">9.4 External Links and Services</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Our platform may contain links to external websites, job boards, or career resources. We are not responsible for the content, privacy practices, or availability of these external services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ASPIRELY.AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Lost profits or business opportunities</li>
                <li>Data loss or corruption</li>
                <li>Employment-related decisions based on our content</li>
                <li>Third-party actions or decisions</li>
                <li>Service interruptions or technical failures</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                Our total liability to you for any claims arising from or related to these Terms or our services shall not exceed the amount you paid to us in the 12 months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Indemnification</h2>
              <p className="text-gray-700 dark:text-gray-300">
                You agree to indemnify, defend, and hold harmless Aspirely.ai and our officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising from your use of our services, violation of these Terms, or infringement of any rights of another party.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to modify these Terms at any time. When we make material changes, we will:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Post the updated Terms on our website</li>
                <li>Send email notifications to registered users</li>
                <li>Display prominent notices on our platform</li>
                <li>Provide at least 30 days notice for significant changes</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                Your continued use of our services after the effective date constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">13. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or our services shall be resolved through:
              </p>
              <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Good faith negotiations between the parties</li>
                <li>Mediation if direct negotiations fail</li>
                <li>Binding arbitration as a final resort</li>
              </ol>
              <p className="text-gray-700 dark:text-gray-300">
                You may also contact our support team at support@aspirely.ai to resolve any issues informally before pursuing formal dispute resolution.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">14. Severability and Entire Agreement</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect. These Terms, together with our Privacy Policy, constitute the entire agreement between you and Aspirely.ai regarding our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">15. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                For questions about these Terms or our services, please contact us:
              </p>
              <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg border border-gray-300 dark:border-gray-800">
                <p className="text-gray-900 dark:text-white font-medium mb-2">Aspirely.ai Legal Team</p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">Email: support@aspirely.ai</p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">Response Time: Within 48 hours</p>
                <p className="text-gray-700 dark:text-gray-300">
                  For urgent legal matters, please mark your email subject with "URGENT - Legal Inquiry"
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">16. Effective Date</h2>
              <p className="text-gray-700 dark:text-gray-300">
                These Terms of Service are effective as of {new Date().toLocaleDateString()} and apply to all use of Aspirely.ai services on or after this date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>;
};
export default TermsOfService;