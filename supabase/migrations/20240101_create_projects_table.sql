-- Create projects table for Web OS submissions
-- Run this in Supabase Dashboard > SQL Editor

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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON public.projects USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

-- Full text search on name and description
CREATE INDEX IF NOT EXISTS idx_projects_search ON public.projects USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Auto-update updated_at timestamp
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

-- Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view approved projects
CREATE POLICY "Public can view approved projects"
    ON public.projects
    FOR SELECT
    USING (status = 'approved');

-- Policy: Anyone can insert (submit new project)
CREATE POLICY "Anyone can submit projects"
    ON public.projects
    FOR INSERT
    WITH CHECK (true);

-- Policy: Only authenticated users can update (for admin review)
CREATE POLICY "Only authenticated can update"
    ON public.projects
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Sample data (optional - remove if not needed)
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