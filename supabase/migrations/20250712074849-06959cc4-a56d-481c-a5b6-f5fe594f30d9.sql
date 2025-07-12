-- Remove report_data column and add specific report columns
ALTER TABLE public.grace_interview_requests 
DROP COLUMN IF EXISTS report_data,
ADD COLUMN executive_summary JSONB DEFAULT NULL,
ADD COLUMN overall_scores JSONB DEFAULT NULL,
ADD COLUMN strengths JSONB DEFAULT NULL,
ADD COLUMN areas_for_improvement JSONB DEFAULT NULL,
ADD COLUMN detailed_feedback JSONB DEFAULT NULL,
ADD COLUMN motivational_message TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.grace_interview_requests.executive_summary IS 'Executive summary of the interview including candidate name, position, company, overall readiness score, key verdict, and summary text';
COMMENT ON COLUMN public.grace_interview_requests.overall_scores IS 'Overall scores for different interview sections (greeting, technical, behavioral, etc.)';
COMMENT ON COLUMN public.grace_interview_requests.strengths IS 'Array of strengths identified during the interview with area, description, and evidence';
COMMENT ON COLUMN public.grace_interview_requests.areas_for_improvement IS 'Array of areas needing improvement with area, description, and impact';
COMMENT ON COLUMN public.grace_interview_requests.detailed_feedback IS 'Detailed feedback for each section of the interview';
COMMENT ON COLUMN public.grace_interview_requests.motivational_message IS 'Personalized encouragement message based on candidate background and potential';