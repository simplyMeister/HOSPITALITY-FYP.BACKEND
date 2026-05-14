-- 1. Set a default value for encryption_key so new rows always have one
ALTER TABLE conversations 
ALTER COLUMN encryption_key SET DEFAULT encode(gen_random_bytes(32), 'base64');

-- 2. Ensure ALL current conversations have a key (just in case any were missed)
UPDATE conversations 
SET encryption_key = encode(gen_random_bytes(32), 'base64')
WHERE encryption_key IS NULL;

-- 3. Verify the increment function is perfectly aligned with UUIDs
CREATE OR REPLACE FUNCTION increment(row_id UUID, column_name TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE conversations SET %I = %I + 1 WHERE id = %L', column_name, column_name, row_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
