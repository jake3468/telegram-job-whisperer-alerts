
-- Enable RLS on system tables that may not have it enabled yet
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_executions ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for system tables (execution_logs and webhook_executions)
-- These are accessed by edge functions and triggers with service role permissions
CREATE POLICY "Allow all operations on execution logs" 
ON public.execution_logs 
FOR ALL 
USING (true);

CREATE POLICY "Allow all operations on webhook executions" 
ON public.webhook_executions 
FOR ALL 
USING (true);
