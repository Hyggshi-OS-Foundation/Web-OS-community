# Supabase Setup Guide for Web OS Community

## Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Enter project name: `web-os-community`
4. Set a strong database password
5. Wait for project to be ready (~2 minutes)

### 2. Get Your Credentials
1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Update Credentials in Code
Open `supabase.js` and replace:
```js
const SUPABASE_URL = 'https://lkwlvoivjintumgmqxdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd2x2b2l2amludHVtZ21xeGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDc0MzUsImV4cCI6MjA5Nzk4MzQzNX0.Gmy5KhG6XO8djN2HmTx-CpP1BPSk9i24pUZ9oyN3N8k';
```

### 4. Run Database Migrations
In Supabase Dashboard, go to **SQL Editor** and run these migrations in order:

#### Migration 1: Create Projects Table
```sql
-- Copy from: supabase/migrations/20240101_create_projects_table.sql
```

#### Migration 2: Create Profiles Table
```sql
-- Copy from: supabase/migrations/20240102_create_profiles_table.sql
```

#### Migration 3: Add User ID to Projects
```sql
-- Copy from: supabase/migrations/20240103_add_user_id_to_projects.sql
```

### 5. Enable Authentication
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. (Optional) Disable "Confirm email" for testing

### 6. Test the Setup
1. Open `index.html` in browser
2. Open Developer Console (F12)
3. You should see: `✅ Supabase initialized`
4. Click **Login / Sign Up** to test auth
5. Click **Submit Project** to test submission

---

## Database Schema

### Table: `projects`
Stores all Web OS project submissions.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| name | TEXT | OS name |
| url | TEXT | Live demo URL |
| icon | TEXT | Icon/logo URL |
| author | TEXT | GitHub username |
| repo | TEXT | Repository name |
| foundation | TEXT | Foundation name |
| description | TEXT | Short description |
| version | TEXT | Version number |
| featured | BOOLEAN | Featured badge |
| tags | TEXT[] | Array of tags |
| links | JSONB | Array of {label, url} |
| status | TEXT | `pending` / `approved` / `rejected` |
| user_id | UUID | References auth.users(id) |
| created_at | TIMESTAMPTZ | Auto-set on insert |
| updated_at | TIMESTAMPTZ | Auto-update on change |

### Table: `profiles`
Stores user account information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (references auth.users) |
| username | TEXT | Unique username |
| display_name | TEXT | Display name |
| avatar_url | TEXT | Avatar image URL |
| bio | TEXT | User bio |
| github_url | TEXT | GitHub profile URL |
| created_at | TIMESTAMPTZ | Auto-set on insert |
| updated_at | TIMESTAMPTZ | Auto-update on change |

---

## Row Level Security (RLS) Policies

### Projects Table
- **Public**: Can view only `approved` projects
- **Public**: Can insert (submit new project)
- **Authenticated**: Can view own `pending` projects
- **Authenticated**: Can update/delete own projects

### Profiles Table
- **Public**: Can view all profiles
- **Authenticated**: Can insert/update own profile

---

## Troubleshooting

### "Supabase chưa được cấu hình"
- Check `supabase.js` has correct URL and anon key
- Make sure `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js">` is in `index.html`

### "Failed to load Supabase client"
- Check internet connection (CDN needs to load)
- Check browser console for CORS errors
- Try hard refresh (Ctrl+Shift+R)

### Data not saving
1. Check browser console for errors
2. Verify migrations ran successfully in Supabase SQL Editor
3. Check Supabase Dashboard → Table Editor → projects
4. Make sure RLS policies are correct
5. Check that `status` column exists and defaults to `'pending'`

### Auth not working
1. Enable Email provider in Authentication settings
2. Check if "Confirm email" is blocking login
3. For testing, disable email confirmation temporarily

---

## Admin Workflow

1. **User submits project** → `status = 'pending'`
2. **Admin reviews** in Supabase Dashboard → Table Editor → projects
3. **Filter by** `status = 'pending'`
4. **Change status** to `approved` or `rejected`
5. **Approved projects** appear on website automatically

---

## Security Notes

- ✅ Using anon key (safe for frontend)
- ✅ RLS policies protect data
- ✅ Users can only modify their own submissions
- ❌ Never expose `service_role` key in frontend
- ❌ Never commit real credentials to git

---

## Development vs Production

### Development
- Use Supabase local instance: `supabase start`
- Credentials in `supabase.js` can be test keys

### Production
- Deploy to Netlify/Vercel
- Update `supabase.js` with production credentials
- Enable email confirmation
- Set up CORS in Supabase settings

---

## Need Help?

- Check browser console for detailed error messages
- Check Supabase Dashboard → Logs for server-side errors
- Open an issue in the repository