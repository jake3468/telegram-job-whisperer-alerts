import { Layout } from "@/components/Layout";
import AIMockInterviewForm from "@/components/AIMockInterviewForm";
const AIMockInterview = () => {
  return <Layout>
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
               <span className="text-5xl">📞</span>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-left">AI Mock Interview</h1>
            </div>
            
            <h2 className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">Get a Mock Interview Phone Call from 👩🏻 Grace</h2>
            
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">Grace, your AI interview assistant from Aspirely AI, will call your phone in about a minute to ask real interview questions based on your job role—and you’ll receive a detailed report after the call.</p>
          </div>

          {/* Form Section */}
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <AIMockInterviewForm />
            </div>
          </div>

        </div>
      </div>
    </Layout>;
};
export default AIMockInterview;