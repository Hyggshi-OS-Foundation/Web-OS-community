-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT NOT NULL,
    author TEXT NOT NULL,
    repo TEXT NOT NULL,
    foundation TEXT DEFAULT 'N/A',
    description TEXT DEFAULT '',
    version TEXT DEFAULT '1.0',
    license TEXT DEFAULT 'MIT',
    platform TEXT DEFAULT 'Netlify',
    os_status TEXT DEFAULT 'Stable',
    featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    links JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending',
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Public can view approved projects" ON projects;
DROP POLICY IF EXISTS "Public can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can view own pending projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Policy: Public can view only approved projects
CREATE POLICY "Public can view approved projects"
    ON projects FOR SELECT
    USING (status = 'approved');

-- Policy: Public can insert (submit new project)
CREATE POLICY "Public can insert projects"
    ON projects FOR INSERT
    WITH CHECK (true);

-- Policy: Authenticated users can view their own pending projects
CREATE POLICY "Users can view own pending projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id AND status = 'pending');

-- Policy: Authenticated users can update their own projects
CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Authenticated users can delete their own projects
CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (to allow re-running migration)
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at();
