
-- Step 1: Restore the LinkedIn image webhook trigger that was accidentally dropped
CREATE OR REPLACE FUNCTION public.handle_linkedin_image_webhook()
RETURNS TRIGGER AS $$
DECLARE
    user_data RECORD;
    payload JSONB;
    edge_function_url TEXT;
    fingerprint TEXT;
    n8n_webhook_url TEXT;
BEGIN
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Create fingerprint for LinkedIn image record
    fingerprint := 'LII_' || encode(
        digest(
            NEW.id::TEXT || 
            COALESCE(NEW.post_id::TEXT, '') || 
            COALESCE(NEW.variation_number::TEXT, '') ||
            extract(epoch from NEW.created_at)::TEXT,
            'sha256'
        ),
        'hex'
    );
    
    -- Get the N8N webhook URL from secrets
    SELECT decrypted_secret INTO n8n_webhook_url 
    FROM vault.decrypted_secrets 
    WHERE name = 'N8N_LINKEDIN_IMAGE_WEBHOOK_URL';
    
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/linkedin-image-webhook';
    
    -- Build payload for LinkedIn image generation
    payload := jsonb_build_object(
        'linkedin_image', jsonb_build_object(
            'id', NEW.id,
            'post_id', NEW.post_id,
            'variation_number', NEW.variation_number,
            'image_data', NEW.image_data,
            'created_at', NEW.created_at
        ),
        'event_type', 'linkedin_image_created',
        'webhook_type', 'linkedin_image',
        'timestamp', now(),
        'n8n_webhook_url', n8n_webhook_url,
        'anti_duplicate_metadata', jsonb_build_object(
            'fingerprint', fingerprint,
            'trigger_source', 'linkedin_image_trigger_v1',
            'submission_time', extract(epoch from now())
        )
    );
    
    -- Make HTTP POST request to edge function
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk',
            'X-Fingerprint', fingerprint,
            'X-Source', 'linkedin-image-trigger-v1',
            'X-Webhook-Type', 'linkedin_image'
        ),
        body := payload
    );
    
    RAISE LOG 'LinkedIn image webhook triggered for record % with fingerprint %', NEW.id, fingerprint;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in LinkedIn image webhook: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for LinkedIn image webhook
CREATE TRIGGER trigger_linkedin_image_webhook
    AFTER INSERT ON public.linkedin_post_images
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_linkedin_image_webhook();
