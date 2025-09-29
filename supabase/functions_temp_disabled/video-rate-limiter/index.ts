import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { videoPath, userAgent, sessionId } = await req.json();
    
    // Get client IP (in production, this would be more sophisticated)
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     '127.0.0.1';

    // Basic bot detection
    const isSuspiciousBot = (userAgent: string) => {
      const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /curl/i, /wget/i, /python/i, /php/i,
        /facebook/i, /twitter/i, /linkedin/i
      ];
      
      return botPatterns.some(pattern => pattern.test(userAgent));
    };

    // Check if this looks like a bot
    if (isSuspiciousBot(userAgent)) {
      console.log('Bot detected:', { userAgent, clientIP });
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'Bot traffic detected',
          retryAfter: 3600 // 1 hour
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check rate limits - max 10 requests per IP per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: recentRequests, error } = await supabase
      .from('video_analytics')
      .select('id')
      .eq('ip_address', clientIP)
      .gte('played_at', tenMinutesAgo);

    if (error) {
      console.error('Error checking rate limits:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If too many requests from this IP
    if (recentRequests && recentRequests.length >= 10) {
      console.log('Rate limit exceeded:', { clientIP, requestCount: recentRequests.length });
      
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'Rate limit exceeded',
          retryAfter: 600, // 10 minutes
          requestCount: recentRequests.length
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log the video request
    const { error: insertError } = await supabase
      .from('video_analytics')
      .insert({
        video_path: videoPath,
        ip_address: clientIP,
        user_agent: userAgent,
        session_id: sessionId,
        played_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error logging video request:', insertError);
    }

    // Allow the request
    return new Response(
      JSON.stringify({ 
        allowed: true,
        message: 'Video access granted',
        remainingRequests: Math.max(0, 10 - (recentRequests?.length || 0))
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in video rate limiter:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});