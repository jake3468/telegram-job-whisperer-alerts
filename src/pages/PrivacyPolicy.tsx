import { useEffect } from 'react';

const PrivacyPolicy = () => {
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
            Privacy Policy
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
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">1. Information We Collect</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                At Aspirely.ai, we collect information you provide directly to us, such as when you create an account, 
                use our services, or contact us for support.
              </p>
              <h3 className="text-xl font-semibold text-white mt-6">Personal Information:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name and email address</li>
                <li>Professional information (resume, work history, skills)</li>
                <li>Job preferences and career goals</li>
                <li>Communication preferences</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">2. How We Use Your Information</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Match you with relevant job opportunities</li>
                <li>Send you updates about your job applications</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to improve our platform</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">3. Information Sharing</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
                except as described in this privacy policy.
              </p>
              <p>We may share your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With employers when you apply for jobs through our platform</li>
                <li>With service providers who assist us in operating our platform</li>
                <li>When required by law or to protect our rights</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">4. Data Security</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                We implement appropriate security measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">5. Your Rights</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of certain communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">6. Cookies and Tracking</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                We use cookies and similar tracking technologies to improve your experience on our platform. 
                You can control cookie settings through your browser preferences.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">7. Changes to This Policy</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes by posting 
                the new privacy policy on this page and updating the "Last updated" date.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">8. Contact Us</h2>
            <div className="text-gray-300 space-y-4 font-inter">
              <p>
                If you have any questions about this privacy policy, please contact us at:
              </p>
              <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <p className="font-semibold text-white">Aspirely.ai</p>
                <p>Email: privacy@aspirely.ai</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;