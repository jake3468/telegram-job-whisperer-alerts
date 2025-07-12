-- Add new columns for interview reports and analysis to grace_interview_requests table
ALTER TABLE public.grace_interview_requests 
ADD COLUMN interview_status TEXT DEFAULT NULL,
ADD COLUMN completion_percentage INTEGER DEFAULT NULL,
ADD COLUMN time_spent TEXT DEFAULT NULL,
ADD COLUMN feedback_message TEXT DEFAULT NULL,
ADD COLUMN feedback_suggestion TEXT DEFAULT NULL,
ADD COLUMN feedback_next_action TEXT DEFAULT NULL,
ADD COLUMN report_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN report_data JSONB DEFAULT NULL,
ADD COLUMN actionable_plan JSONB DEFAULT NULL,
ADD COLUMN next_steps_priority JSONB DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.grace_interview_requests.interview_status IS 'Status of interview: EARLY_TERMINATION, PARTIAL_COMPLETION, SUBSTANTIAL_COMPLETION, FULL_COMPLETION';
COMMENT ON COLUMN public.grace_interview_requests.completion_percentage IS 'Percentage of interview completed (0-100)';
COMMENT ON COLUMN public.grace_interview_requests.time_spent IS 'Time spent during interview (e.g., "Less than 30 seconds", "X minutes")';
COMMENT ON COLUMN public.grace_interview_requests.feedback_message IS 'Main feedback message from interview';
COMMENT ON COLUMN public.grace_interview_requests.feedback_suggestion IS 'Suggestions for improvement';
COMMENT ON COLUMN public.grace_interview_requests.feedback_next_action IS 'Recommended next actions';
COMMENT ON COLUMN public.grace_interview_requests.report_generated IS 'Whether a detailed report was generated';
COMMENT ON COLUMN public.grace_interview_requests.report_data IS 'Complete report JSON data from N8N';
COMMENT ON COLUMN public.grace_interview_requests.actionable_plan IS 'Actionable plan items for improvement';
COMMENT ON COLUMN public.grace_interview_requests.next_steps_priority IS 'Priority list of next steps';