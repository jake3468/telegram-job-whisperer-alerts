import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InterviewReportData {
  interviewStatus: "EARLY_TERMINATION" | "PARTIAL_COMPLETION" | "SUBSTANTIAL_COMPLETION" | "FULL_COMPLETION";
  completionPercentage: number;
  timeSpent: string;
  feedback: {
    message: string;
    suggestion: string;
    nextAction: string;
  };
  reportGenerated: boolean;
  report?: any;
  requestId?: string; // The grace_interview_requests ID to update
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Grace Interview Webhook - Processing request');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the request body
    const requestData: InterviewReportData = await req.json();
    console.log('📋 Received data:', {
      requestId: requestData.requestId,
      interviewStatus: requestData.interviewStatus,
      completionPercentage: requestData.completionPercentage,
      reportGenerated: requestData.reportGenerated
    });

    // Validate required fields
    if (!requestData.requestId) {
      console.error('❌ Missing requestId in webhook data');
      return new Response(
        JSON.stringify({ error: 'Missing requestId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare data for database update
    const updateData = {
      interview_status: requestData.interviewStatus,
      completion_percentage: requestData.completionPercentage,
      time_spent: requestData.timeSpent,
      feedback_message: requestData.feedback?.message,
      feedback_suggestion: requestData.feedback?.suggestion,
      feedback_next_action: requestData.feedback?.nextAction,
      report_generated: requestData.reportGenerated,
      executive_summary: requestData.report?.executiveSummary || null,
      overall_scores: requestData.report?.overallScores || null,
      strengths: requestData.report?.strengths || null,
      areas_for_improvement: requestData.report?.areasForImprovement || null,
      detailed_feedback: requestData.report?.detailedFeedback || null,
      actionable_plan: requestData.report?.actionablePlan || null,
      next_steps_priority: requestData.report?.nextStepsPriorityList || null,
      motivational_message: requestData.report?.motivationalMessage || null,
    };

    console.log('💾 Updating database for request:', requestData.requestId);

    // Update the grace_interview_requests record
    const { data, error } = await supabase
      .from('grace_interview_requests')
      .update(updateData)
      .eq('id', requestData.requestId)
      .select();

    if (error) {
      console.error('❌ Database update error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update database', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!data || data.length === 0) {
      console.error('❌ No record found with ID:', requestData.requestId);
      return new Response(
        JSON.stringify({ error: 'Interview request not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Successfully updated interview request:', data[0].id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Interview report updated successfully',
        requestId: requestData.requestId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});