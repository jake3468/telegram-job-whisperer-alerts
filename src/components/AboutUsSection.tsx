const AboutUsSection = () => {
  return <section id="about-us" className="bg-black py-4 md:py-6 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-3">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-2 font-inter">
            We've Been in Your Shoes
          </h2>
          
          <div className="bg-gradient-to-r from-sky-900/20 to-indigo-900/20 rounded-2xl p-6 md:p-8 border border-sky-600/20 shadow-xl">
            <p className="md:text-lg text-gray-300 font-inter font-light leading-relaxed mb-4 text-sm text-left">
              <em className="text-sky-300">We know the feeling.</em> The endless applications, the silence after interviews, 
              the frustration of not knowing what employers really want. We've been there—refreshing job boards 
              at 2 AM, wondering if our resumes even get read.
            </p>
            
            <p className="md:text-lg text-gray-300 font-inter font-light leading-relaxed mb-4 text-sm text-left">
              That's exactly why we built <span className="font-semibold text-white">Aspirely.ai</span>. 
              We experienced the same struggles, the same rejections, the same uncertainty. 
              <em className="text-fuchsia-300"> We wished we had the tools that actually work</em>—not just generic advice, 
              but personalized, AI-powered insights that give you a real edge.
            </p>
            
            <p className="md:text-lg text-gray-300 font-inter font-light leading-relaxed text-sm text-left">
              Today, we're not just building a product—we're building the solution we desperately needed. 
              <strong className="text-cyan-300">Your success is our mission</strong>, because we remember what it felt like 
              to struggle alone in the job search.
            </p>
            
            <div className="mt-6 text-right">
              <p className="text-base text-sky-400 font-inter italic">
                — The Aspirely.ai Team
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default AboutUsSection;