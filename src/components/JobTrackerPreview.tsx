import jobTrackerImage from '@/assets/job-tracker-preview.png';

const JobTrackerPreview = () => {
  return (
    <section className="bg-black py-8 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="relative h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] rounded-3xl overflow-hidden shadow-2xl border border-gray-800/50">
          <img 
            src={jobTrackerImage}
            alt="Job Tracker Interface Preview - Manage your job applications with ease"
            className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-6 right-6">
            <h3 className="text-white text-lg sm:text-xl font-semibold mb-2 font-inter">
              Your Job Search, Organized
            </h3>
            <p className="text-gray-300 text-sm sm:text-base font-inter">
              Track applications, prep for interviews, and never miss an opportunity
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JobTrackerPreview;