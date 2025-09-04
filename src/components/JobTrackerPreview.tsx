import { JobTrackerVideo } from './JobTrackerVideo';

const JobTrackerPreview = () => {
  return (
    <section className="bg-black pt-0 pb-8 px-0 md:px-4 overflow-hidden">
      <div className="w-full md:max-w-4xl md:mx-auto">
        <JobTrackerVideo 
          className="w-full"
          showControls={true}
        />
      </div>
    </section>
  );
};

export default JobTrackerPreview;