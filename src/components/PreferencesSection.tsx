import { MapPin, Briefcase, Clock, Wifi } from "lucide-react";
const PreferencesSection = () => {
  return <section className="bg-black py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Job Preferences Card */}
          <div className="bg-pastel-mint rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <h3 className="font-semibold mb-6 font-inter text-black text-3xl">
              Job Preferences
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-black mt-1" />
                <div>
                  <h4 className="font-medium text-black font-inter">Location</h4>
                  <p className="text-black/70 text-sm font-inter font-light">
                    City, Country or 'Remote'
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Briefcase className="w-5 h-5 text-black mt-1" />
                <div>
                  <h4 className="font-medium text-black font-inter">Job Titles</h4>
                  <p className="text-black/70 text-sm font-inter font-light">
                    Software Engineer, Data Analyst, Product Manager
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-black mt-1" />
                <div>
                  <h4 className="font-medium text-black font-inter">Alert Frequency</h4>
                  <p className="text-black/70 text-sm font-inter font-light">
                    Daily, Every 3 days, or Weekly
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Wifi className="w-5 h-5 text-black mt-1" />
                <div>
                  <h4 className="font-medium text-black font-inter">Job Type</h4>
                  <p className="text-black/70 text-sm font-inter font-light">
                    Remote, On-site, or Hybrid
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Telegram Connection Card */}
          <div className="bg-pastel-peach rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <h3 className="font-semibold text-black mb-6 font-inter text-3xl">
              Connect Telegram
            </h3>
            
            <p className="text-black/80 mb-6 font-inter font-light leading-relaxed">
              We'll send all job updates and documents directly to your Telegram account.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                <p className="text-black/80 text-sm font-inter">
                  Open Telegram and search for @JobBotAlert
                </p>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                <p className="text-black/80 text-sm font-inter">
                  Click 'Start' to link your account
                </p>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                <p className="text-black/80 text-sm font-inter">
                  After successful verification using your unique bot ID, you're good to start!
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Info Banner */}
        <div className="mt-12 bg-black border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-white font-inter font-light">
            📱 We'll send personalized job updates and your resume-matched openings to your Telegram bot.
          </p>
        </div>
      </div>
    </section>;
};
export default PreferencesSection;