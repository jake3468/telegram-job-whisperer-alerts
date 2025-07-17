-- Fix job tracker order position issues by ensuring unique order positions within each status
-- Step 1: Create a unique constraint on (user_id, status, order_position)

-- First, let's rebalance existing order positions to prevent conflicts
CREATE OR REPLACE FUNCTION public.rebalance_job_tracker_order_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    status_record RECORD;
    job_record RECORD;
    new_position INTEGER;
BEGIN
    -- For each user
    FOR user_record IN 
        SELECT DISTINCT user_id FROM public.job_tracker
    LOOP
        -- For each status
        FOR status_record IN 
            SELECT DISTINCT status FROM public.job_tracker WHERE user_id = user_record.user_id
        LOOP
            new_position := 0;
            
            -- Rebalance all jobs for this user and status
            FOR job_record IN 
                SELECT id FROM public.job_tracker 
                WHERE user_id = user_record.user_id AND status = status_record.status
                ORDER BY order_position ASC, created_at ASC
            LOOP
                UPDATE public.job_tracker 
                SET order_position = new_position 
                WHERE id = job_record.id;
                
                new_position := new_position + 1;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RAISE LOG 'Rebalanced order positions for all users and statuses';
END;
$$;

-- Run the rebalancing function
SELECT public.rebalance_job_tracker_order_positions();

-- Add unique constraint to prevent future conflicts
-- This will ensure each (user_id, status, order_position) combination is unique
ALTER TABLE public.job_tracker 
ADD CONSTRAINT unique_user_status_order_position 
UNIQUE (user_id, status, order_position);

-- Create a function to get the next available order position for a status
CREATE OR REPLACE FUNCTION public.get_next_order_position(p_user_id UUID, p_status job_status)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    max_position INTEGER;
BEGIN
    SELECT COALESCE(MAX(order_position), -1) INTO max_position
    FROM public.job_tracker
    WHERE user_id = p_user_id AND status = p_status;
    
    RETURN max_position + 1;
END;
$$;

-- Create a function to handle order position conflicts during inserts
CREATE OR REPLACE FUNCTION public.handle_job_tracker_order_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- If there's a conflict, get the next available position
    IF EXISTS (
        SELECT 1 FROM public.job_tracker 
        WHERE user_id = NEW.user_id 
        AND status = NEW.status 
        AND order_position = NEW.order_position
        AND id != NEW.id
    ) THEN
        NEW.order_position := public.get_next_order_position(NEW.user_id, NEW.status);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to handle conflicts before insert
CREATE TRIGGER job_tracker_order_conflict_trigger
    BEFORE INSERT ON public.job_tracker
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_job_tracker_order_conflict();