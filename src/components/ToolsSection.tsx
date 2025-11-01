import FeatureSection from "./FeatureSection";
import { useEffect, useRef } from "react";

const ToolsSection = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20px 0px -50px 0px',
      threshold: 0.3
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.classList.contains('animate-in')) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    if (headingRef.current) {
      observer.observe(headingRef.current);
    }

    return () => {
      if (headingRef.current) {
        observer.unobserve(headingRef.current);
      }
    };
  }, []);

  return <section id="features" className="relative bg-background" aria-labelledby="features-heading">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h2 id="features-heading" ref={headingRef} className="animate-on-scroll text-center sm:text-4xl font-bold text-foreground mb-2 font-inter md:text-3xl text-2xl">Additional Tools & Features</h2>
      </div>

      {/* Feature Sections */}
      <div className="space-y-0">
        {/* Job Board - First Feature */}
        <FeatureSection title="Job Board" subheading="Fresh, relevant jobs that match you" description="All the jobs your Job Alerts AI Agent finds on Telegram appear here automatically. You'll only see roles that match your profile and were posted within the last seven days. The board has three tabs: Today's Jobs, Last 7 Days, and Saved. No old posts or irrelevant listings—just the right jobs in one place." lottieUrl="https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations//alerts%20job.json" buttonText="See Today's Jobs" isReversed={false} />

        {/* Job Tracker - Second Feature */}
        <FeatureSection title="Job Tracker" subheading="Keep track of every job you apply to" description="Save any job from the board to the Job Tracker and stay organized through every step. You can mark jobs as Saved, Applied, Interview, Offer, or Rejected, and use simple checklists to stay on top of what's next. No more lost tabs or forgotten applications." lottieUrl="https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/business%20workshop.json" buttonText="Start Tracking" isReversed={true} />

        {/* AI Phone Interview - Third Feature */}
        <FeatureSection title="AI Phone Interview" subheading="Practice real interviews over the phone" description="When you get an interview, add your phone number and our AI will call you for a short mock interview. It sounds just like a real recruiter, asks job-related questions, and gives detailed feedback report on your answers, tone, and what to improve. It's the easiest way to prepare with zero scheduling." lottieUrl="https://fnzloyyhzhrqsvslhhri.supabase.co/storage/v1/object/public/animations/Interview%20_%20Get%20Ready%20to%20work-%20Job%20Recruitment%20(isometric-hiring-process).json" buttonText="Start Interview" isReversed={false} />

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