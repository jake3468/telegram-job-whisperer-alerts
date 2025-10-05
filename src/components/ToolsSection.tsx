import FeatureSection from "./FeatureSection";
const ToolsSection = () => {
  return <section id="features" className="relative bg-background">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h2 className="text-left lg:text-center sm:text-4xl font-bold text-foreground mb-2 font-inter md:text-3xl text-2xl">and there's more...</h2>
      </div>

      {/* Feature Sections */}
      <div className="space-y-0">
        {/* Job Board - First Feature */}
        <FeatureSection title="📋 Job Board" subheading="Only fresh jobs. No ancient listings." description="Scrolling through job sites is exhausting. Half the jobs are from 3 weeks ago, the other half don't even match what you do. We show you only jobs from the last 24 hours that actually fit your role and location. No clutter. No ancient listings. No wasting your time." lottieUrl="https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations//alerts%20job.json" buttonText="See Today's Jobs" isReversed={false} />

        {/* Job Tracker - Second Feature */}
        <FeatureSection title="✅ Job Tracker" subheading="Stop losing track in browser tabs." description="You know how you end up with job links in random browser tabs, notes on your phone, and zero idea what you applied for last week? Keep everything in one place. Each job gets a simple checklist so you know exactly what to do next—instead of staring at your screen wondering 'now what?'" lottieUrl="https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/business%20workshop.json" buttonText="Start Tracking" isReversed={true} />

        {/* AI Phone Interview - Third Feature */}
        <FeatureSection title="📞 AI Phone Interview" subheading="Practice like it's real—because it sounds real" description="Talking to yourself in the mirror before interviews? We've all been there. It doesn't work. Our AI calls your actual phone number, has a real conversation, and gives you honest feedback. No weird video calls. No scheduling. Just pick up the phone and practice like it's the real thing." lottieUrl="https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/Interview%20_%20Get%20Ready%20to%20work-%20Job%20Recruitment%20(isometric-hiring-process).json" buttonText="Start Interview" isReversed={false} />

        {/* LinkedIn Post Generator - Sixth Feature */}
        {/* <FeatureSection title="LinkedIn Post Generator" subheading="Turn your thoughts into scroll-stopping content." description="Get three ready-to-post LinkedIn drafts based on your topic, opinion, story, target audience, and tone. Whether you're sharing a lesson, an insight, or a bold take, your post is tailored to sound like you — not a bot. You can even generate matching visuals in one click to bring your post to life." lottieUrl="https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/linkedin%20icon.json" buttonText="Generate Post" isReversed={false} /> */}

        {/* Placeholder for other features - to be added later */}
        <div className="py-16 px-4 text-center">
          <p className="text-muted-foreground font-inter">
            More features coming soon...
          </p>
        </div>
      </div>
    </section>;
};
export default ToolsSection;