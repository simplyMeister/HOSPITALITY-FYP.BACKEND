-- 1. Ensure RLS is enabled on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Own notifications only" ON public.notifications;

-- 3. Create comprehensive policies for notifications
-- Policy for viewing own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = recipient_id);

-- Policy for marking own notifications as read (The missing piece!)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

-- 4. Enable replica identity to ensure filters work correctly in Realtime
-- This ensures that the recipient_id is always sent with the payload so the frontend filter works reliably
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 5. Notify the user
-- Successfully hardened notification security and fixed 'mark as read' functionality.
