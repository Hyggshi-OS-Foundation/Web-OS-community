-- Populate profiles table for existing users who don't have a profile yet
-- This creates profile entries from auth.users data

INSERT INTO public.profiles (id, username, display_name, avatar_url, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data->>'username',
        split_part(au.email, '@', 1)
    ) as username,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        split_part(au.email, '@', 1)
    ) as display_name,
    COALESCE(
        au.raw_user_meta_data->>'avatar_url',
        ''
    ) as avatar_url,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Log the result
DO $$
DECLARE
    inserted_count INTEGER;
BEGIN
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RAISE NOTICE 'Created % profile(s) for existing users', inserted_count;
END $$;