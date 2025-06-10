
-- Create table to track webhook executions
CREATE TABLE public.webhook_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fingerprint TEXT NOT NULL,
    submission_id TEXT,
    record_id UUID,
    request_type TEXT,
    status TEXT DEFAULT 'processing',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    webhook_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX idx_webhook_executions_fingerprint ON public.webhook_executions(fingerprint);
CREATE INDEX idx_webhook_executions_submission_id ON public.webhook_executions(submission_id);
CREATE INDEX idx_webhook_executions_executed_at ON public.webhook_executions(executed_at);

-- Clean up old executions function
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_executions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.webhook_executions 
    WHERE executed_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Add execution logs table for monitoring
CREATE TABLE public.execution_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_type TEXT NOT NULL,
    data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for execution logs
CREATE INDEX idx_execution_logs_timestamp ON public.execution_logs(timestamp);
CREATE INDEX idx_execution_logs_type ON public.execution_logs(log_type);
