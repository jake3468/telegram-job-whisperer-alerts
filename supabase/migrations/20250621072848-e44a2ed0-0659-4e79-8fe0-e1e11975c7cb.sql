
-- Create a table for interview prep data
CREATE TABLE public.interview_prep (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  interview_questions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) 
ALTER TABLE public.interview_prep ENABLE ROW LEVEL SECURITY;

-- Add RLS policies - users can only access their own interview prep data
CREATE POLICY "Users can view their own interview prep" 
  ON public.interview_prep 
  FOR SELECT 
  USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users can create their own interview prep" 
  ON public.interview_prep 
  FOR INSERT 
  WITH CHECK (user_id = public.get_current_user_uuid());

CREATE POLICY "Users can update their own interview prep" 
  ON public.interview_prep 
  FOR UPDATE 
  USING (user_id = public.get_current_user_uuid());

CREATE POLICY "Users can delete their own interview prep" 
  ON public.interview_prep 
  FOR DELETE 
  USING (user_id = public.get_current_user_uuid());

-- Add updated_at trigger
CREATE TRIGGER update_interview_prep_updated_at
  BEFORE UPDATE ON public.interview_prep
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create credit deduction trigger for interview prep
CREATE OR REPLACE FUNCTION public.deduct_credits_for_interview_prep()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid UUID;
    deduction_success BOOLEAN;
BEGIN
    -- Get the user_id from user_profile table
    SELECT up.user_id INTO user_uuid
    FROM public.user_profile up
    WHERE up.id = NEW.user_id;
    
    IF user_uuid IS NOT NULL THEN
        -- Deduct 1.5 credits for interview prep
        SELECT public.deduct_credits(
            user_uuid,
            1.5,
            'interview_prep',
            'Credits deducted for interview prep generation'
        ) INTO deduction_success;
        
        IF NOT deduction_success THEN
            RAISE LOG 'Failed to deduct credits for interview prep. User: %, Prep ID: %', user_uuid, NEW.id;
        ELSE
            RAISE LOG 'Successfully deducted 1.5 credits for interview prep. User: %, Prep ID: %', user_uuid, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for credit deduction after interview prep results are generated
CREATE TRIGGER deduct_credits_after_interview_prep
  AFTER INSERT ON public.interview_prep
  FOR EACH ROW
  WHEN (NEW.interview_questions IS NOT NULL)
  EXECUTE FUNCTION public.deduct_credits_for_interview_prep();

-- Add cleanup function for old interview prep data
CREATE OR REPLACE FUNCTION public.cleanup_old_interview_prep_data()
RETURNS TABLE(deleted_interview_prep integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_prep_count integer := 0;
BEGIN
    -- Delete old interview prep data
    DELETE FROM public.interview_prep 
    WHERE created_at < NOW() - INTERVAL '60 days';
    
    GET DIAGNOSTICS deleted_prep_count = ROW_COUNT;
    
    -- Log the cleanup
    RAISE LOG 'Interview prep cleanup completed: % prep sessions deleted', 
        deleted_prep_count;
    
    RETURN QUERY SELECT deleted_prep_count;
END;
$$;
