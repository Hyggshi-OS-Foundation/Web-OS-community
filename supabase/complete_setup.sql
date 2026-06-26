-- Complete Database Setup for Web OS Community
-- Run this ENTIRE script in Supabase Dashboard > SQL Editor

-- ============================================
-- 1. CREATE PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT NOT NULL,
    author TEXT NOT NULL,
    repo TEXT NOT NULL,
    foundation TEXT DEFAULT 'N/A',
    description TEXT DEFAULT '',
    version TEXT DEFAULT '1.0',
    featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    links JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    github_url TEXT,
    zashi_linked BOOLEAN DEFAULT false,
    zashi_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON public.projects USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Full text search
CREATE INDEX IF NOT EXISTS idx_projects_search ON public.projects USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- ============================================
-- 4. CREATE FUNCTIONS & TRIGGERS
-- ============================================
-- Auto-update updated_at for projects
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for profiles
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_profiles_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        INSERT INTO public.profiles (id, username, display_name)
        VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'username',
            NEW.raw_user_meta_data->>'display_name'
        );
    EXCEPTION
        WHEN undefined_table THEN NULL;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES - PROJECTS
-- ============================================
-- Drop existing policies first
DROP POLICY IF EXISTS "Public can view approved projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can submit projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own pending projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- Public can view approved projects
CREATE POLICY "Public can view approved projects"
    ON public.projects
    FOR SELECT
    USING (status = 'approved');

-- Anyone can insert (submit new project)
CREATE POLICY "Anyone can submit projects"
    ON public.projects
    FOR INSERT
    WITH CHECK (true);

-- Users can view their own pending projects
CREATE POLICY "Users can view own pending projects"
    ON public.projects
    FOR SELECT
    USING (
        status = 'approved' 
        OR (auth.role() = 'authenticated' AND user_id = auth.uid())
    );

-- Users can update own projects
CREATE POLICY "Users can update own projects"
    ON public.projects
    FOR UPDATE
    USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Users can delete own projects
CREATE POLICY "Users can delete own projects"
    ON public.projects
    FOR DELETE
    USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- ============================================
-- 7. CREATE RLS POLICIES - PROFILES
-- ============================================
-- Drop existing policies first
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Anyone can view profiles
CREATE POLICY "Public can view profiles"
    ON public.profiles
    FOR SELECT
    USING (true);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- 8. INSERT SAMPLE DATA (OPTIONAL)
-- ============================================
INSERT INTO public.projects (name, url, icon, author, repo, foundation, description, version, featured, tags, links, status)
VALUES (
    'AvdanOS',
    'https://dynamicos.netlify.app',
    'https://github.com/DynamicCode1/AvdanOSdemo/blob/main/logo.png?raw=true',
    'DynamicCode1',
    'AvdanOSdemo',
    'DynamicCode1',
    'A modern web-based desktop experience built with web technologies. Lightweight and fast.',
    '2.0',
    true,
    ARRAY['webos', 'demo', 'lightweight', 'netlify'],
    '[{"label": "Main", "url": "https://dynamicos.netlify.app"}]'::jsonb,
    'approved'
),
(
    'Hyggshi OS Web Edition',
    'https://hyggshiosdeveloper.github.io/hyggshi-os-website/OSmain.html',
    'https://raw.githubusercontent.com/HyggshiOSDeveloper/hyggshi-os-website/refs/heads/main/Resources/favicon.ico',
    'HyggshiOSDeveloper',
    'hyggshi-os-website',
    'Hyggshi-OS-Foundation',
    'A full-featured web OS with a modern interface, supporting multiple apps and cloud deployment.',
    '1.0',
    true,
    ARRAY['webos', 'full', 'modern', 'cloudflare'],
    '[{"label": "View Web OS in Pages", "url": "https://hyggshiosdeveloper.github.io/hyggshi-os-website/OSmain.html"}, {"label": "View Web OS in cloudflare", "url": "https://hyggshi-os-website.pages.dev/OSmain"}]'::jsonb,
    'approved'
);

-- ============================================
-- DONE! Refresh the page and try signing up again
-- ============================================