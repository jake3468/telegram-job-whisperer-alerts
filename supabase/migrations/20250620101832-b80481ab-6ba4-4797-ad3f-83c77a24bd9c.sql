
-- Remove the analysis_result column and add new structured columns
ALTER TABLE public.company_role_analyses 
DROP COLUMN IF EXISTS analysis_result;

-- Add general information columns
ALTER TABLE public.company_role_analyses 
ADD COLUMN research_date DATE,
ADD COLUMN local_role_market_context TEXT,
ADD COLUMN company_news_updates TEXT[];

-- Add Role Security columns
ALTER TABLE public.company_role_analyses 
ADD COLUMN role_security_score INTEGER CHECK (role_security_score >= 0 AND role_security_score <= 100),
ADD COLUMN role_security_score_breakdown TEXT[],
ADD COLUMN role_security_outlook TEXT,
ADD COLUMN role_security_automation_risks TEXT,
ADD COLUMN role_security_departmental_trends TEXT;

-- Add Role Experience columns
ALTER TABLE public.company_role_analyses 
ADD COLUMN role_experience_score INTEGER CHECK (role_experience_score >= 0 AND role_experience_score <= 100),
ADD COLUMN role_experience_score_breakdown TEXT[],
ADD COLUMN role_experience_specific_insights TEXT;
