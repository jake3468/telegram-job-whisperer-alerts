
import FeatureSection from "./FeatureSection";

const ToolsSection = () => {
  return (
    <section id="features" className="relative bg-black">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-4 font-inter">
          Unlock Your Career Potential
        </h2>
        <p className="text-base sm:text-xl text-gray-400 font-inter font-light">
          Explore our AI-powered tools designed to streamline your job search.
        </p>
      </div>

      {/* Feature Sections */}
      <div className="space-y-0">
        {/* Telegram Job Alerts - First Feature */}
        <FeatureSection
          title="Telegram Job Alerts"
          subheading="Get only jobs posted in the last 24 hours — matched to your role & location. Before anyone else."
          description="Our intelligent job alert system monitors thousands of job boards 24/7 and sends you personalized notifications directly to your Telegram. No more endless scrolling through irrelevant job postings. Get real-time alerts for positions that match your skills, experience level, and location preferences. Set up multiple alerts for different roles and never miss your dream opportunity again."
          lottieUrl="https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations//Notifications.json"
          buttonText="Set Up Alerts"
          isReversed={false}
        />

        {/* Job Tracker - Second Feature */}
        <FeatureSection
          title="Job Tracker"
          subheading="Ditch the spreadsheets. Take control of your job hunt."
          description="You're not just applying — you're chasing what's next. With Aspirely, every job you save comes with an instant, AI-powered checklist — resume tweaks, mock interviews, company insights — all lined up, ready to go. Drag jobs across stages like Interested, Applied, and Interviewing — and actually feel progress. No mess. No stress. Just momentum."
          lottieUrl="https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations//business%20workshop.json"
          buttonText="Start Tracking"
          isReversed={true}
        />

        {/* Placeholder for other features - to be added later */}
        <div className="py-16 px-4 text-center">
          <p className="text-gray-400 font-inter">
            More features coming soon...
          </p>
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
