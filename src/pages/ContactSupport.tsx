
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft, Mail, Clock, Users, Shield } from 'lucide-react';

const ContactSupport = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-cyan-400 dark:text-cyan-300 hover:text-cyan-300 dark:hover:text-cyan-200 transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <div className="space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 dark:from-cyan-300 dark:to-cyan-200 bg-clip-text text-transparent mb-4">
              Contact Support
            </h1>
            <p className="text-muted-foreground text-lg">We're here to help you succeed in your career journey</p>
          </div>

          <div className="prose prose-invert dark:prose-invert prose-cyan max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Get in Touch</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our dedicated support team is committed to helping you make the most of Aspirely.ai's AI-powered career tools. Whether you have questions about our features, need technical assistance, or want guidance on optimizing your job search strategy, we're here to support you every step of the way.
              </p>
              
              <div className="bg-gradient-to-r from-cyan-100/20 to-cyan-200/20 dark:from-cyan-900/50 dark:to-cyan-800/50 p-8 rounded-xl border border-cyan-500/30 shadow-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-sky-500 p-3 rounded-full">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Email Support</h3>
                    <p className="text-sky-200">Our primary support channel</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-white text-xl font-semibold">support@aspirely.ai</p>
                  <div className="flex items-center gap-2 text-sky-200">
                    <Clock className="w-4 h-4" />
                    <span>Response time: Within 48 hours</span>
                  </div>
                  <p className="text-gray-300 mt-4">
                    For the fastest response, please include your account email, a detailed description of your issue, and any relevant screenshots or error messages.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6">Support Categories</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 hover:border-sky-500/50 transition-colors">
                  <h3 className="text-xl font-semibold text-sky-400 mb-3">Technical Issues</h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• Login and account access problems</li>
                    <li>• Payment processing issues</li>
                    <li>• AI service errors or timeouts</li>
                    <li>• File download problems</li>
                    <li>• Telegram bot connectivity</li>
                    <li>• Platform bugs and glitches</li>
                  </ul>
                </div>

                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 hover:border-sky-500/50 transition-colors">
                  <h3 className="text-xl font-semibold text-sky-400 mb-3">Account Management</h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• Subscription changes and cancellations</li>
                    <li>• Credit balance inquiries</li>
                    <li>• Refund requests</li>
                    <li>• Account deletion requests</li>
                    <li>• Profile and data management</li>
                    <li>• Privacy and security concerns</li>
                  </ul>
                </div>

                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 hover:border-sky-500/50 transition-colors">
                  <h3 className="text-xl font-semibold text-sky-400 mb-3">Feature Guidance</h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• How to use specific AI tools</li>
                    <li>• Best practices for better results</li>
                    <li>• Feature requests and suggestions</li>
                    <li>• Integration setup assistance</li>
                    <li>• Telegram bot configuration</li>
                    <li>• Content optimization tips</li>
                  </ul>
                </div>

                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 hover:border-sky-500/50 transition-colors">
                  <h3 className="text-xl font-semibold text-sky-400 mb-3">Career Consultation</h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• Job search strategy advice</li>
                    <li>• Resume optimization guidance</li>
                    <li>• Interview preparation tips</li>
                    <li>• LinkedIn profile enhancement</li>
                    <li>• Career transition support</li>
                    <li>• Industry-specific insights</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Premium Support Benefits</h2>
              <div className="bg-gradient-to-r from-fuchsia-900/30 to-purple-900/30 p-6 rounded-lg border border-fuchsia-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-fuchsia-400" />
                  <h3 className="text-xl font-semibold text-white">For Paid Subscribers</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-fuchsia-300 mb-2">Priority Response</h4>
                    <p className="text-gray-300 text-sm">Your support requests are prioritized and handled by our senior support specialists for faster resolution.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-fuchsia-300 mb-2">Advanced Assistance</h4>
                    <p className="text-gray-300 text-sm">Access to detailed career guidance, personalized optimization tips, and advanced feature tutorials.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-fuchsia-300 mb-2">Direct Access</h4>
                    <p className="text-gray-300 text-sm">Skip general support queues and get direct access to technical specialists familiar with premium features.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-fuchsia-300 mb-2">Feature Previews</h4>
                    <p className="text-gray-300 text-sm">Early access to beta features and direct feedback channels for platform improvements.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-3">How do I maximize my AI-generated content quality?</h3>
                  <p className="text-gray-300 mb-3">
                    To get the best results from our AI tools:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                    <li>Complete your profile with detailed resume and career information</li>
                    <li>Provide specific job descriptions and company details</li>
                    <li>Use clear, descriptive language in your requests</li>
                    <li>Review and refine generated content for your personal voice</li>
                    <li>Take advantage of multiple variations to find the best fit</li>
                  </ul>
                </div>

                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-3">What should I do if my credits aren't working correctly?</h3>
                  <p className="text-gray-300 text-sm">
                    If you're experiencing credit-related issues, first check your account balance in your profile. If credits aren't being deducted properly or you're seeing incorrect balances, contact our support team with your account email and a description of the issue. We'll investigate and resolve credit discrepancies promptly.
                  </p>
                </div>

                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-3">How do I set up Telegram integrations?</h3>
                  <p className="text-gray-300 text-sm">
                    Our Telegram bots require initial setup through your Aspirely.ai account. Navigate to the Job Alerts or Resume Builder sections, where you'll find setup instructions and bot links. If you encounter issues connecting to our bots, ensure your Telegram privacy settings allow messages from bots, and contact support if problems persist.
                  </p>
                </div>

                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-3">Can I get refunds for unused credits or subscriptions?</h3>
                  <p className="text-gray-300 text-sm">
                    We offer refunds within 48 hours for technical issues preventing service use, processing errors, or cancellations within 48 hours of initial subscription. Contact our support team with your request details, and we'll process approved refunds to your original payment method within 48 hours.
                  </p>
                </div>

                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-3">How do I delete my account and data?</h3>
                  <p className="text-gray-300 text-sm">
                    You can delete your account through your profile settings, or contact our support team for assistance. Account deletion removes all personal data, generated content, and account history within 30 days. This action is irreversible, so please ensure you've downloaded any content you wish to keep before proceeding.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Emergency Support</h2>
              <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-red-400 mb-3">Urgent Issues</h3>
                <p className="text-gray-300 mb-4">
                  For critical issues that significantly impact your job search or account security, mark your email subject with "URGENT - [Issue Type]" for expedited handling.
                </p>
                <p className="text-gray-300 text-sm">
                  Examples of urgent issues: unauthorized account access, payment fraud, critical technical errors preventing service access, or data privacy concerns requiring immediate attention.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Business Hours and Response Times</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-sky-400 mb-3">Standard Support</h3>
                  <div className="space-y-2 text-gray-300">
                    <p><strong>Response Time:</strong> Within 48 hours</p>
                    <p><strong>Coverage:</strong> 7 days a week</p>
                    <p><strong>Best For:</strong> General questions, feature guidance, account management</p>
                  </div>
                </div>

                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold text-fuchsia-400 mb-3">Premium Support</h3>
                  <div className="space-y-2 text-gray-300">
                    <p><strong>Response Time:</strong> Within 24 hours</p>
                    <p><strong>Coverage:</strong> Priority queue handling</p>
                    <p><strong>Best For:</strong> Paid subscribers, technical issues, career consultation</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Support Best Practices</h2>
              <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">Help Us Help You</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">When Contacting Support:</h4>
                    <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                      <li>Include your account email address</li>
                      <li>Describe the issue in detail</li>
                      <li>Mention which feature you were using</li>
                      <li>Include any error messages</li>
                      <li>Attach relevant screenshots</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">For Faster Resolution:</h4>
                    <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                      <li>Check our FAQ section first</li>
                      <li>Try refreshing or logging out/in</li>
                      <li>Clear browser cache if needed</li>
                      <li>Test on different browsers/devices</li>
                      <li>Note when the issue started occurring</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Feedback and Suggestions</h2>
              <p className="text-gray-300 mb-4">
                We value your input in making Aspirely.ai even better. Whether you have ideas for new features, suggestions for improving existing tools, or feedback about your experience, we want to hear from you.
              </p>
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <h3 className="text-lg font-semibold text-green-400 mb-3">Share Your Ideas</h3>
                <p className="text-gray-300 mb-3">
                  Email us at <strong>support@aspirely.ai</strong> with the subject line "Feature Request" or "Feedback" to share your thoughts on:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                  <li>New AI tools you'd like to see</li>
                  <li>Improvements to existing features</li>
                  <li>Integration requests</li>
                  <li>User experience enhancements</li>
                  <li>Industry-specific adaptations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Our Commitment to You</h2>
              <div className="bg-gradient-to-r from-sky-900/30 to-fuchsia-900/30 p-8 rounded-xl border border-sky-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-sky-400" />
                  <h3 className="text-xl font-semibold text-white">Dedicated Support Team</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Our support team consists of career professionals and technical experts who understand both the challenges of job searching and the intricacies of AI-powered tools. We're not just here to solve technical problems – we're here to help you succeed in your career journey. Every interaction with our support team is an opportunity to improve your experience and achieve your professional goals.
                </p>
                <div className="mt-6 p-4 bg-black/30 rounded-lg">
                  <p className="text-sky-200 font-medium text-center">
                    "Your success is our success. We're committed to providing the support you need to make the most of AI in your career advancement."
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;
