-- 1. Ensure the increment function exists for unread counts
CREATE OR REPLACE FUNCTION increment(row_id UUID, column_name TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE conversations SET %I = %I + 1 WHERE id = %L', column_name, column_name, row_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure all conversations have an encryption key
UPDATE conversations 
SET encryption_key = encode(gen_random_bytes(32), 'base64')
WHERE encryption_key IS NULL;
