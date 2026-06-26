# Database Setup Guide

## Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project name and password
4. Wait for project to be ready

### 2. Run Database Migration
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy content from `supabase/migrations/20240101_create_projects_table.sql`
4. Paste into SQL Editor
5. Click **Run** to execute

### 3. Get API Credentials
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xyz.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 4. Configure Credentials
Open `supabase.js` and replace:
```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 5. Deploy
Deploy to Netlify/Vercel/GitHub Pages with the configured `supabase.js`

---

## Database Schema

### Table: `projects`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `name` | TEXT | OS name (required) |
| `url` | TEXT | Live demo URL (required) |
| `icon` | TEXT | Icon/logo URL (required) |
| `author` | TEXT | GitHub username (required) |
| `repo` | TEXT | Repository name (required) |
| `foundation` | TEXT | Foundation name (optional) |
| `description` | TEXT | Short description |
| `version` | TEXT | Version number |
| `featured` | BOOLEAN | Featured badge |
| `tags` | TEXT[] | Array of tags |
| `links` | JSONB | Array of `{label, url}` |
| `status` | TEXT | `pending` / `approved` / `rejected` |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Auto-update on change |

### Indexes
- `status` - Filter approved projects
- `featured` - Sort featured first
- `tags` (GIN) - Fast tag search
- `created_at` - Sort by newest
- Full-text search on `name` + `description`

### Row Level Security (RLS)
- **Public**: Can view only `approved` projects
- **Public**: Can insert (submit new project)
- **Authenticated**: Can update (admin review)

---

## Admin Review Workflow

1. User submits project → `status = 'pending'`
2. Admin goes to Supabase Dashboard → Table Editor → `projects`
3. Filter by `status = 'pending'`
4. Review and change `status` to `approved` or `rejected`
5. Approved projects appear on website automatically

---

## Local Development

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Apply migration
supabase db reset
```

---

## Security Notes

- Never expose service_role key in frontend
- Use anon key for public operations
- RLS policies protect data
- Admin operations require authentication