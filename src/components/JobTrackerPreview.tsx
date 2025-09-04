import { JobTrackerVideo } from './JobTrackerVideo';

const JobTrackerPreview = () => {
  return (
    <section className="bg-black pt-0 pb-8 px-2 md:px-4 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <JobTrackerVideo 
          className="w-full max-w-4xl mx-auto"
          showControls={true}
        />
      </div>
    </section>
  );
};

export default JobTrackerPreview;