-- Add columns for WhatsApp-style features
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Create an index for performance if needed
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(is_deleted);
