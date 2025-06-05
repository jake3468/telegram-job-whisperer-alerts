
import { MapPin, Briefcase, Clock, Wifi, ArrowRight, CheckCircle, MessageCircle } from "lucide-react";

const PreferencesSection = () => {
  return (
    <section className="bg-black py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Job Preferences Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-white text-3xl font-inter">
                  Job Preferences
                </h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white font-inter text-lg">Location</h4>
                    <p className="text-blue-100 text-sm font-inter">
                      City, Country or 'Remote'
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white font-inter text-lg">Job Titles</h4>
                    <p className="text-blue-100 text-sm font-inter">
                      Software Engineer, Data Analyst, Product Manager
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white font-inter text-lg">Alert Frequency</h4>
                    <p className="text-blue-100 text-sm font-inter">
                      Daily, Every 3 days, or Weekly
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Wifi className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white font-inter text-lg">Job Type</h4>
                    <p className="text-blue-100 text-sm font-inter">
                      Remote, On-site, or Hybrid
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Telegram Connection Card */}
          <div className="bg-gradient-to-br from-orange-600 to-orange-800 border-2 border-orange-400 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-28 h-28 bg-white/10 rounded-full -translate-y-14 -translate-x-14"></div>
            <div className="absolute bottom-0 right-0 w-36 h-36 bg-white/5 rounded-full translate-y-18 translate-x-18"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="font-bold text-white text-3xl font-inter">
                  Connect Telegram
                </h3>
              </div>
              
              <p className="text-orange-100 mb-8 font-inter leading-relaxed text-lg">
                We'll send all job updates and documents directly to your Telegram account.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-white text-orange-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-orange-100 font-inter">
                      Open Telegram and search for <span className="text-white font-semibold">@JobBotAlert</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-white text-orange-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-orange-100 font-inter">
                      Click <span className="text-white font-semibold">'Start'</span> to link your account
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-white text-orange-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-orange-100 font-inter">
                      After successful verification using your unique bot ID, you're ready to start!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Info Banner */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-purple-800 border-2 border-purple-400 rounded-2xl p-8 text-center shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-white" />
            <h4 className="text-white font-inter font-semibold text-xl">Ready to Get Started?</h4>
          </div>
          <p className="text-purple-100 font-inter text-lg">
            📱 We'll send personalized job updates and your resume-matched openings to your Telegram bot.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PreferencesSection;
