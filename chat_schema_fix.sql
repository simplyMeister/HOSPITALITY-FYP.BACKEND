-- 1. Update messages table to be more flexible with sender IDs
-- Removing the strict foreign key to public.profiles and linking to auth.users if possible
-- Or just ensuring the column exists and is a UUID
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- 2. Ensure the sender_id is just a UUID that matches auth.uid()
ALTER TABLE public.messages 
ALTER COLUMN sender_id SET NOT NULL;

-- 3. Update RLS to be extremely clear
DROP POLICY IF EXISTS "Only participants can send messages" ON public.messages;
CREATE POLICY "Only participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE gcs_id = auth.uid() OR hospitality_id = auth.uid()
    )
  );

-- 4. Ensure the system can update conversation previews without RLS friction
DROP POLICY IF EXISTS "System can update conversations" ON public.conversations;
CREATE POLICY "System can update conversations" ON public.conversations
  FOR UPDATE USING (
    gcs_id = auth.uid() OR hospitality_id = auth.uid()
  );
