
-- Add new JSON columns to company_role_analyses table
ALTER TABLE public.company_role_analyses 
ADD COLUMN role_compensation_analysis JSONB,
ADD COLUMN role_workplace_environment JSONB,
ADD COLUMN career_development JSONB,
ADD COLUMN role_specific_considerations JSONB,
ADD COLUMN interview_and_hiring_insights JSONB,
ADD COLUMN sources JSONB;
