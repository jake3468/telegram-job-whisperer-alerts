import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-black text-slate-50 font-inter">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors mb-8">
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <div className="space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-invert prose-sky max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Welcome to Aspirely.ai ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our AI-powered job hunting services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Aspirely.ai is committed to protecting your privacy and ensuring transparency about our data practices. As an AI-powered platform that helps job seekers with personalized career tools, we understand the sensitivity of the information you share with us and take our responsibility to protect it seriously.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-sky-400 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-300 mb-4">We collect the following types of personal information:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                <li><strong>Contact Information:</strong> Email addresses, names, and other contact details</li>
                <li><strong>Professional Information:</strong> Resume content, work experience, education details, skills, and job preferences</li>
                <li><strong>Location Data:</strong> Geographic location information for personalized job alerts and location-based pricing</li>
                <li><strong>Payment Information:</strong> Billing details and payment method information (processed securely through our payment processor)</li>
                
              </ul>

              
              
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                
                
                
                
                
                
              </ul>

              <h3 className="text-xl font-medium text-sky-400 mb-3">2.2 Generated Content</h3>
              <p className="text-gray-300">
                We store the content generated through our AI tools, including cover letters, interview preparation materials, LinkedIn posts, and job analyses, to provide you with access to your history and improve our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-300 mb-4">We use the collected information for the following purposes:</p>
              
              <h3 className="text-xl font-medium text-sky-400 mb-3">3.1 Service Delivery</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                <li>Generate personalized cover letters using Claude (by Anthropic)</li>
                <li>Create tailored interview preparation materials using Claude (by Anthropic)</li>
                <li>Provide job analysis and company insights using OpenAI and Perplexity AI</li>
                <li>Deliver personalized job alerts via Telegram using RapidAPI and OpenAI</li>
                <li>Generate LinkedIn content using Perplexity and OpenAI</li>
                <li>Provide resume building and updating services through our Telegram bot using OpenAI</li>
              </ul>

              <h3 className="text-xl font-medium text-sky-400 mb-3">3.2 Platform Operations</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                <li>Process payments and manage subscriptions through DodoPayments</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send service-related notifications and updates</li>
                <li>Maintain and improve our platform's functionality</li>
                <li>Ensure security and prevent fraud</li>
              </ul>

              <h3 className="text-xl font-medium text-sky-400 mb-3">3.3 Personalization and Analytics</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Analyze usage patterns to improve our AI models</li>
                <li>Customize your experience based on preferences</li>
                <li>Develop new features and services</li>
                <li>Generate aggregated, non-identifiable statistics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-medium text-sky-400 mb-3">4.1 Third-Party AI Services</h3>
              <p className="text-gray-300 mb-4">To provide our core services, we share your data with the following service providers under strict data processing agreements:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                <li><strong>OpenAI:</strong> For job analysis, job alerts personalization, LinkedIn content generation, and resume bot functionality</li>
                <li><strong>Anthropic (Claude):</strong> For cover letter generation and interview preparation materials</li>
                <li><strong>Perplexity AI:</strong> For company analysis and LinkedIn content research</li>
                <li><strong>RapidAPI:</strong> For job searching and aggregation services</li>
              </ul>

              <h3 className="text-xl font-medium text-sky-400 mb-3">4.2 Workflow Automation</h3>
              <p className="text-gray-300 mb-4">
                We use n8n for workflow automation, which may process your data to coordinate between different services and deliver seamless experiences.
              </p>

              <h3 className="text-xl font-medium text-sky-400 mb-3">4.3 Communication Platforms</h3>
              <p className="text-gray-300 mb-4">
                We use Telegram to deliver job alerts and provide resume bot services. Your interaction data with these bots is processed to provide personalized responses.
              </p>

              <h3 className="text-xl font-medium text-sky-400 mb-3">4.4 Payment Processing</h3>
              <p className="text-gray-300 mb-4">
                Payment information is processed by DodoPayments, our secure payment processor. We do not store complete payment card information on our servers.
              </p>

              <h3 className="text-xl font-medium text-sky-400 mb-3">4.5 Legal Requirements</h3>
              <p className="text-gray-300">
                We may disclose your information if required by law, legal process, or to protect the rights, property, or safety of Aspirely.ai, our users, or others.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention and Deletion</h2>
              <p className="text-gray-300 mb-4">
                We retain your personal information for as long as your account remains active or as needed to provide you services. When you delete your account, we will:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Delete your personal information from our active databases within 30 days</li>
                <li>Remove your generated content (cover letters, interview prep materials, etc.)</li>
                <li>Anonymize any remaining data used for analytics purposes</li>
                <li>Notify our third-party processors to delete your data from their systems</li>
              </ul>
              <p className="text-gray-300">
                Some information may be retained in backup systems for up to 90 days for security and recovery purposes, after which it will be permanently deleted.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Data Security</h2>
              <p className="text-gray-300 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure API integrations with third-party services</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>
              <p className="text-gray-300">
                While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but continuously work to improve our security measures.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights and Choices</h2>
              
              <h3 className="text-xl font-medium text-sky-400 mb-3">7.1 Access and Control</h3>
              <p className="text-gray-300 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                <li>Access and review your personal information</li>
                <li>Update or correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of non-essential communications</li>
              </ul>

              <h3 className="text-xl font-medium text-sky-400 mb-3">7.2 Communication Preferences</h3>
              <p className="text-gray-300 mb-4">
                You can manage your communication preferences, including job alerts frequency and promotional emails, through your account settings or by contacting us directly.
              </p>

              <h3 className="text-xl font-medium text-sky-400 mb-3">7.3 Content Ownership</h3>
              <p className="text-gray-300">
                You retain ownership of all content generated through our platform, including cover letters, resumes, and other materials. You can download and use this content freely.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. International Data Transfers</h2>
              <p className="text-gray-300 mb-4">
                As we use various third-party AI services and tools, your data may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and that adequate safeguards are in place.
              </p>
              <p className="text-gray-300">
                Our third-party processors, including OpenAI, Anthropic, and others, have their own privacy policies and data protection measures. We recommend reviewing their policies to understand how they handle your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Children's Privacy</h2>
              <p className="text-gray-300">
                While we do not have specific age restrictions, our services are designed for job seekers and professionals. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-300 mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Posting the updated policy on our website</li>
                <li>Sending an email notification to registered users</li>
                <li>Displaying a prominent notice on our platform</li>
              </ul>
              <p className="text-gray-300">
                Your continued use of our services after the effective date of the updated Privacy Policy constitutes acceptance of the changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Information</h2>
              <p className="text-gray-300 mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <p className="text-white font-medium mb-2">Aspirely.ai Privacy Team</p>
                <p className="text-gray-300 mb-2">Email: support@aspirely.ai</p>
                <p className="text-gray-300 mb-2">Response Time: Within 48 hours</p>
                <p className="text-gray-300">
                  For urgent privacy-related matters, please mark your email subject with "URGENT - Privacy Request"
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Effective Date</h2>
              <p className="text-gray-300">
                This Privacy Policy is effective as of {new Date().toLocaleDateString()} and applies to all information collected by Aspirely.ai on or after this date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>;
};
export default PrivacyPolicy;