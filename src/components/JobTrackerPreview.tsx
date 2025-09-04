const JobTrackerPreview = () => {
  return (
    <section className="bg-black pt-0 pb-8 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-gray-800/50">
          <img 
            src="/lovable-uploads/ae14cafd-7775-4b28-9bbf-76fde85f2cf5.png"
            alt="Job Tracker Interface Preview - Manage your job applications with ease"
            className="w-full h-full object-contain sm:object-cover"
            style={{ objectPosition: '50% 0%' }}
            loading="lazy"
          />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
};

export default JobTrackerPreview;