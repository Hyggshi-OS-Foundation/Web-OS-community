-- Add user_id to projects table to link submissions to accounts
-- Run this AFTER the first two migrations

-- Add user_id column
ALTER TABLE public.projects 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Update RLS policy: users can view their own pending projects
CREATE POLICY "Users can view own pending projects"
    ON public.projects
    FOR SELECT
    USING (
        status = 'approved' 
        OR (auth.role() = 'authenticated' AND user_id = auth.uid())
    );

-- Update RLS policy: authenticated users can update their own projects
DROP POLICY IF EXISTS "Only authenticated can update" ON public.projects;

CREATE POLICY "Users can update own projects"
    ON public.projects
    FOR UPDATE
    USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Allow authenticated users to delete their own projects
CREATE POLICY "Users can delete own projects"
    ON public.projects
    FOR DELETE
    USING (auth.role() = 'authenticated' AND user_id = auth.uid());