import { JobTrackerVideo } from './JobTrackerVideo';

const JobTrackerPreview = () => {
  return (
    <section className="bg-black pt-0 pb-8 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <JobTrackerVideo 
          className="w-full"
          showControls={true}
        />
      </div>
    </section>
  );
};

export default JobTrackerPreview;