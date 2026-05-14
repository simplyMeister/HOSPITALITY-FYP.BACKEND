-- Add the missing category column to notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS category text;

-- Also ensure 'type' exists just in case other parts of the app use it
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS type text;

-- Refresh the RLS policies to make sure they still work
DROP POLICY IF EXISTS "Own notifications only" ON public.notifications;
CREATE POLICY "Own notifications only" ON public.notifications 
FOR SELECT USING (recipient_id = auth.uid());
