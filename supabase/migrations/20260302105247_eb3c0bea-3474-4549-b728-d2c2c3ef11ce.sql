
-- Drop the overly permissive INSERT policy
DROP POLICY "Authenticated users can insert notifications" ON public.notifications;

-- More specific: only allow inserting notifications where user_id != inserter (notify others)
CREATE POLICY "Users can insert notifications for others"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id != auth.uid());
