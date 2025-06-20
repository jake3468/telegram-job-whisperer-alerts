
-- Create table for company-role analysis data
CREATE TABLE public.company_role_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profile(id),
    company_name TEXT NOT NULL,
    location TEXT NOT NULL,
    job_title TEXT NOT NULL,
    analysis_result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS with permissive policies (following the same pattern as other tables)
ALTER TABLE public.company_role_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select operations on company role analyses" 
ON public.company_role_analyses 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all insert operations on company role analyses" 
ON public.company_role_analyses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all update operations on company role analyses" 
ON public.company_role_analyses 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all delete operations on company role analyses" 
ON public.company_role_analyses 
FOR DELETE 
USING (true);

-- Add trigger to update updated_at column
CREATE TRIGGER update_company_role_analyses_updated_at
    BEFORE UPDATE ON public.company_role_analyses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to deduct credits for company-role analysis
CREATE OR REPLACE FUNCTION public.deduct_credits_for_company_role_analysis()
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
        -- Deduct 1.5 credits for company-role analysis
        SELECT public.deduct_credits(
            user_uuid,
            1.5,
            'company_role_analysis',
            'Credits deducted for company-role analysis generation'
        ) INTO deduction_success;
        
        IF NOT deduction_success THEN
            RAISE LOG 'Failed to deduct credits for company-role analysis. User: %, Analysis ID: %', user_uuid, NEW.id;
        ELSE
            RAISE LOG 'Successfully deducted 1.5 credits for company-role analysis. User: %, Analysis ID: %', user_uuid, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER deduct_credits_for_company_role_analysis_trigger
    AFTER INSERT ON public.company_role_analyses
    FOR EACH ROW EXECUTE FUNCTION public.deduct_credits_for_company_role_analysis();
