
-- Enable real-time updates for interview_prep table
ALTER TABLE public.interview_prep REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_prep;

-- Create index for efficient cleanup queries if not exists
CREATE INDEX IF NOT EXISTS idx_interview_prep_created_at ON public.interview_prep(created_at);
