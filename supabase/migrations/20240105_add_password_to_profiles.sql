-- Add password_hash column to profiles table
-- This allows users to have an additional password stored in their profile

-- Add password_hash column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN password_hash TEXT DEFAULT '';
    END IF;
END $$;