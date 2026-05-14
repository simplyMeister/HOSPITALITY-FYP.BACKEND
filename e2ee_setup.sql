-- Add encryption_key to conversations to support E2EE
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS encryption_key TEXT;

-- Update existing conversations with a random key if they don't have one
-- This ensures existing chats don't break
UPDATE conversations 
SET encryption_key = encode(gen_random_bytes(32), 'base64')
WHERE encryption_key IS NULL;
