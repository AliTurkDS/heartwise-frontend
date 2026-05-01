
-- Fix the update_updated_at function to have search_path set
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER 
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
