import { Layout } from "@/components/Layout";
import AIMockInterviewForm from "@/components/AIMockInterviewForm";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useCachedGraceInterviewRequests } from "@/hooks/useCachedGraceInterviewRequests";
const AIMockInterview = () => {
  const {
    connectionIssue,
    forceRefresh
  } = useCachedGraceInterviewRequests();
  const handleManualRefresh = () => {
    window.location.reload();
  };
  return <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-purple-950 text-white overflow-hidden">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6 relative">
              <span className="text-5xl">📞</span>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-left">AI Mock Interview</h1>
              
              {/* Manual Refresh Button */}
              {connectionIssue && <Button onClick={handleManualRefresh} variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800/50 h-8 w-8 p-0 absolute right-0" title="Refresh page">
                  <RefreshCw className="h-4 w-4" />
                </Button>}
            </div>
            
            <h2 className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">Get a Mock Interview Phone Call from 👩🏻 Grace</h2>
            
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed text-base">Grace, your AI interview assistant from Aspirely AI, will call your phone in about a minute to ask real interview questions based on your job role — and you’ll receive a detailed report right after the call.</p>
          </div>

          {/* Form Section */}
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
              <AIMockInterviewForm />
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-16 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              
              
              
              
            </div>
          </div>
        </div>
      </div>
    </Layout>;
};
export default AIMockInterview;