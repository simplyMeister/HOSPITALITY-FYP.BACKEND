-- Add the missing updated_at column to the messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- Also ensure the other WhatsApp columns are present just in case
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_edited boolean default false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted boolean default false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reactions jsonb default '{}'::jsonb;
