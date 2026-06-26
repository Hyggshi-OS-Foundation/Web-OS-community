-- Add user_id column to projects table (if not already exists)
-- This migration adds the user_id foreign key reference to auth.users

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE projects 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        
        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    END IF;
END $$;

-- Update RLS policies to include user_id check
DROP POLICY IF EXISTS "Users can view own pending projects" ON projects;
CREATE POLICY "Users can view own pending projects"
    ON projects FOR SELECT
    USING (
        (status = 'approved') 
        OR (auth.uid() = user_id AND status = 'pending')
    );

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);