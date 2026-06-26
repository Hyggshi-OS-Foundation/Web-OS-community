-- Fix: Drop existing policies and recreate
-- Run this if you get "policy already exists" error

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view approved projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can submit projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own pending projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate policies for projects
CREATE POLICY "Public can view approved projects"
    ON public.projects FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can submit projects"
    ON public.projects FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own pending projects"
    ON public.projects FOR SELECT USING (
        status = 'approved' OR (auth.role() = 'authenticated' AND user_id = auth.uid())
    );

CREATE POLICY "Users can update own projects"
    ON public.projects FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Recreate policies for profiles
CREATE POLICY "Public can view profiles"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Done! Now try signing up again