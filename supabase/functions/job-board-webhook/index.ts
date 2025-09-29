import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobData {
  user_id: string;
  title: string;
  company_name: string;
  location?: string;
  via?: string;
  thumbnail?: string;
  posted_at?: string;
  salary?: string;
  job_type?: string;
  job_description?: string;
  link_1_title?: string;
  link_1_link?: string;
  link_2_title?: string;
  link_2_link?: string;
  link_3_title?: string;
  link_3_link?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('Job Board Webhook received request');

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    const jobData: JobData = body;
    if (!jobData.user_id || !jobData.title || !jobData.company_name) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: user_id, title, company_name' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate user_id exists in user_profile table
    const { data: userProfile, error: userError } = await supabase
      .from('user_profile')
      .select('id')
      .eq('id', jobData.user_id)
      .single();

    if (userError || !userProfile) {
      console.error('User profile not found:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid user_id - user profile not found' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for duplicate job postings (same title, company, and user)
    const { data: existingJob } = await supabase
      .from('job_board')
      .select('id')
      .eq('user_id', jobData.user_id)
      .eq('title', jobData.title)
      .eq('company_name', jobData.company_name)
      .single();

    if (existingJob) {
      console.log('Duplicate job found, skipping insertion');
      return new Response(
        JSON.stringify({ 
          message: 'Job already exists',
          job_id: existingJob.id 
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Insert job data into job_board table
    const { data: insertedJob, error: insertError } = await supabase
      .from('job_board')
      .insert({
        user_id: jobData.user_id,
        title: jobData.title,
        company_name: jobData.company_name,
        location: jobData.location,
        via: jobData.via,
        thumbnail: jobData.thumbnail,
        posted_at: jobData.posted_at ? new Date(jobData.posted_at).toISOString() : null,
        salary: jobData.salary,
        job_type: jobData.job_type,
        job_description: jobData.job_description,
        link_1_title: jobData.link_1_title,
        link_1_link: jobData.link_1_link,
        link_2_title: jobData.link_2_title,
        link_2_link: jobData.link_2_link,
        link_3_title: jobData.link_3_title,
        link_3_link: jobData.link_3_link,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting job:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to insert job',
          details: insertError.message 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Job inserted successfully:', insertedJob.id);

    return new Response(
      JSON.stringify({ 
        message: 'Job posted successfully',
        job_id: insertedJob.id,
        data: insertedJob
      }), 
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
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