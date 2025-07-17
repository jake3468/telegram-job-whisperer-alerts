import React from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, Users, Building, Calendar, Target, TrendingUp, Star, Award, BookOpen, Lightbulb, ArrowRight } from 'lucide-react';
import { PremiumSectionHeader } from './PremiumSectionHeader';
import { EnhancedPercentageMeter } from './EnhancedPercentageMeter';
import { PremiumBulletPointList } from './PremiumBulletPointList';
import { PremiumJSONDisplay } from './PremiumJSONDisplay';

interface InterviewReport {
  id: string;
  company_name: string;
  job_title: string;
  phone_number: string;
  status: string;
  interview_status?: string;
  completion_percentage?: number;
  time_spent?: string;
  feedback_message?: string;
  feedback_suggestion?: string;
  feedback_next_action?: string;
  actionable_plan?: any;
  next_steps_priority?: any;
  executive_summary?: any;
  overall_scores?: any;
  strengths?: any;
  areas_for_improvement?: any;
  detailed_feedback?: any;
  motivational_message?: string;
  created_at: string;
}

interface PremiumInterviewReportDisplayProps {
  report: InterviewReport;
}

export const PremiumInterviewReportDisplay: React.FC<PremiumInterviewReportDisplayProps> = ({ report }) => {
  const getStatusTheme = (status?: string) => {
    switch (status) {
      case 'FULL_COMPLETION':
        return {
          gradient: 'from-green-500 to-emerald-600',
          theme: 'green' as const,
          bgGradient: 'from-green-50 to-emerald-50'
        };
      case 'SUBSTANTIAL_COMPLETION':
        return {
          gradient: 'from-blue-500 to-cyan-600',
          theme: 'blue' as const,
          bgGradient: 'from-blue-50 to-cyan-50'
        };
      case 'PARTIAL_COMPLETION':
        return {
          gradient: 'from-yellow-500 to-orange-500',
          theme: 'yellow' as const,
          bgGradient: 'from-yellow-50 to-orange-50'
        };
      case 'EARLY_TERMINATION':
        return {
          gradient: 'from-red-500 to-pink-600',
          theme: 'orange' as const,
          bgGradient: 'from-red-50 to-pink-50'
        };
      default:
        return {
          gradient: 'from-gray-500 to-slate-600',
          theme: 'blue' as const,
          bgGradient: 'from-gray-50 to-slate-50'
        };
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'FULL_COMPLETION':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'SUBSTANTIAL_COMPLETION':
        return <CheckCircle className="w-6 h-6 text-blue-600" />;
      case 'PARTIAL_COMPLETION':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'EARLY_TERMINATION':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Clock className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatStatusText = (status?: string) => {
    if (!status) return 'Pending';
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const getCompletionMeter = () => {
    if (!report.completion_percentage) return null;
    const statusTheme = getStatusTheme(report.interview_status);
    return (
      <EnhancedPercentageMeter
        score={report.completion_percentage}
        label="Interview Completion"
        theme={statusTheme.theme}
      />
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusTheme = getStatusTheme(report.interview_status);

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Hero Section */}
      <div className={`relative bg-gradient-to-r ${statusTheme.bgGradient} border-b border-gray-200 px-4 py-6 md:px-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${statusTheme.gradient} shadow-lg`}>
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">
                    {report.company_name}
                  </h1>
                  <p className="text-lg text-gray-700 font-medium break-words">
                    {report.job_title}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(report.created_at)}</span>
                </div>
                {report.time_spent && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{report.time_spent}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px] max-w-full">
              <div className="flex items-center gap-3 mb-3">
                {getStatusIcon(report.interview_status)}
                <div>
                  <h3 className="font-bold text-gray-900">Interview Status</h3>
                  <p className="text-sm text-gray-600">{formatStatusText(report.interview_status)}</p>
                </div>
              </div>
              
              {report.completion_percentage !== null && report.completion_percentage !== undefined && (
                <div className="mb-3">
                  {getCompletionMeter()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-8">
        
        {/* Executive Summary */}
        {report.executive_summary && (
          <div>
            <PremiumSectionHeader
              number={1}
              title="Executive Summary"
              icon={<Star className="w-5 h-5" />}
              gradient={statusTheme.gradient}
              description="Key highlights and overall interview performance overview"
            />
            <div className="mt-4">
              <PremiumJSONDisplay data={report.executive_summary} theme={statusTheme.theme} />
            </div>
          </div>
        )}

        {/* Performance Scores */}
        {report.overall_scores && (
          <div>
            <PremiumSectionHeader
              number={2}
              title="Performance Metrics"
              icon={<Award className="w-5 h-5" />}
              gradient={statusTheme.gradient}
              description="Detailed scoring across different evaluation criteria"
            />
            <div className="mt-4">
              <PremiumJSONDisplay data={report.overall_scores} theme={statusTheme.theme} />
            </div>
          </div>
        )}

        {/* Strengths */}
        {report.strengths && (
          <div>
            <PremiumSectionHeader
              number={3}
              title="Key Strengths"
              icon={<TrendingUp className="w-5 h-5" />}
              gradient="from-green-500 to-emerald-600"
              description="Areas where you excelled during the interview"
            />
            <div className="mt-4">
              <PremiumJSONDisplay data={report.strengths} theme="green" />
            </div>
          </div>
        )}

        {/* Areas for Improvement */}
        {report.areas_for_improvement && (
          <div>
            <PremiumSectionHeader
              number={4}
              title="Growth Opportunities"
              icon={<Target className="w-5 h-5" />}
              gradient="from-orange-500 to-red-500"
              description="Areas identified for development and improvement"
            />
            <div className="mt-4">
              <PremiumJSONDisplay data={report.areas_for_improvement} theme="orange" />
            </div>
          </div>
        )}

        {/* Feedback Analysis */}
        {(report.feedback_message || report.feedback_suggestion || report.feedback_next_action) && (
          <div>
            <PremiumSectionHeader
              number={5}
              title="Personalized Feedback"
              icon={<Lightbulb className="w-5 h-5" />}
              gradient="from-purple-500 to-pink-500"
              description="Tailored feedback and suggestions for your interview performance"
            />
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {report.feedback_message && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-bold text-purple-900 text-sm mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Key Message
                  </h4>
                  <p className="text-gray-800 text-sm leading-relaxed break-words">
                    {report.feedback_message}
                  </p>
                </div>
              )}
              
              {report.feedback_suggestion && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Suggestion
                  </h4>
                  <p className="text-gray-800 text-sm leading-relaxed break-words">
                    {report.feedback_suggestion}
                  </p>
                </div>
              )}
              
              {report.feedback_next_action && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-bold text-green-900 text-sm mb-2 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Next Action
                  </h4>
                  <p className="text-gray-800 text-sm leading-relaxed break-words">
                    {report.feedback_next_action}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detailed Feedback */}
        {report.detailed_feedback && (
          <div>
            <PremiumSectionHeader
              number={6}
              title="Detailed Analysis"
              icon={<BookOpen className="w-5 h-5" />}
              gradient="from-indigo-500 to-purple-500"
              description="In-depth feedback analysis and detailed insights"
            />
            <div className="mt-4">
              <PremiumJSONDisplay data={report.detailed_feedback} theme="indigo" />
            </div>
          </div>
        )}

        {/* Actionable Plan */}
        {report.actionable_plan && (
          <div>
            <PremiumSectionHeader
              number={7}
              title="Action Plan"
              icon={<Target className="w-5 h-5" />}
              gradient="from-teal-500 to-cyan-500"
              description="Concrete steps and actionable recommendations for improvement"
            />
            <div className="mt-4">
              <PremiumJSONDisplay data={report.actionable_plan} theme="teal" />
            </div>
          </div>
        )}

        {/* Next Steps Priority */}
        {report.next_steps_priority && (
          <div>
            <PremiumSectionHeader
              number={8}
              title="Priority Next Steps"
              icon={<ArrowRight className="w-5 h-5" />}
              gradient="from-pink-500 to-rose-500"
              description="Prioritized action items for your interview preparation journey"
            />
            <div className="mt-4">
              <PremiumJSONDisplay data={report.next_steps_priority} theme="pink" />
            </div>
          </div>
        )}

        {/* Motivational Message */}
        {report.motivational_message && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Motivation & Encouragement</h3>
            <p className="text-gray-800 leading-relaxed max-w-2xl mx-auto break-words">
              {report.motivational_message}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};