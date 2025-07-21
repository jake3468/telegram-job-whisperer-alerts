import { useEffect } from 'react';

const TermsOfService = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron mb-6 bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-300 font-inter">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-invert max-w-none">
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">1. Acceptance of Terms</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                By accessing and using Aspirely.ai ("the Service"), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">2. Description of Service</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                Aspirely.ai is an AI-powered career platform that helps users find job opportunities, 
                track applications, and advance their careers through intelligent matching and personalized guidance.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">3. User Accounts</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>To use certain features of our service, you must register for an account. You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">4. Acceptable Use</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>You agree not to use the service to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload false or misleading information</li>
                <li>Impersonate any person or entity</li>
                <li>Violate any laws or regulations</li>
                <li>Interfere with or disrupt the service</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use automated tools to access the service without permission</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">5. Intellectual Property</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                The service and its original content, features, and functionality are owned by Aspirely.ai and are 
                protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">6. Privacy Policy</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, 
                to understand our practices.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">7. Termination</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                We may terminate or suspend your account and bar access to the service immediately, without prior notice 
                or liability, under our sole discretion, for any reason whatsoever and without limitation, including but 
                not limited to a breach of the Terms.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">8. Limitation of Liability</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                In no event shall Aspirely.ai, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                be liable for any indirect, incidental, special, consequential, or punitive damages, including without 
                limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">9. Changes to Terms</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">10. Contact Information</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <p className="font-semibold text-white">Aspirely.ai</p>
                <p>Email: legal@aspirely.ai</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;