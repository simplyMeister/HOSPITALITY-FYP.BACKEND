-- 1. Create Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid primary key default gen_random_uuid(),
  gcs_id uuid references public.gcs_profiles(id) on delete cascade,
  hospitality_id uuid references public.hospitality_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  last_message_at timestamptz default now(),
  last_message_preview text,
  gcs_unread_count int default 0,
  hi_unread_count int default 0,
  unique(gcs_id, hospitality_id)
);

-- 2. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  sender_role text check (sender_role in ('gcs','hospitality')),
  content text not null,
  message_type text check (message_type in ('text','system')) default 'text',
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 3. Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Messages
CREATE POLICY "Conversation participants only" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE gcs_id = auth.uid() OR hospitality_id = auth.uid()
    )
  );

CREATE POLICY "Only participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE gcs_id = auth.uid() OR hospitality_id = auth.uid()
    )
  );

-- 5. RLS Policies for Conversations
CREATE POLICY "Own conversations only" ON public.conversations
  FOR SELECT USING (
    gcs_id = auth.uid() OR hospitality_id = auth.uid()
  );

CREATE POLICY "System can insert conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    gcs_id = auth.uid() OR hospitality_id = auth.uid()
  );

CREATE POLICY "System can update conversations" ON public.conversations
  FOR UPDATE USING (
    gcs_id = auth.uid() OR hospitality_id = auth.uid()
  );

CREATE POLICY "System can update messages" ON public.messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE gcs_id = auth.uid() OR hospitality_id = auth.uid()
    )
  );

-- 6. RPC increments for frontend unread count mutation
CREATE OR REPLACE FUNCTION increment(row_id uuid, column_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE public.conversations SET %I = %I + 1 WHERE id = $1', column_name, column_name)
  USING row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Don't forget to manually go to Database -> Replication in your Supabase Dashboard
-- and explicitly checkmark the "messages" and "conversations" tables to broadcast inserts and updates!
