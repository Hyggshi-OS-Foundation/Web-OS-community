-- Temporary fix: Disable the problematic trigger
-- Run this if signup keeps failing with 500 error

-- Drop the trigger that's causing the error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function too (optional, can keep it)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- After running this, try signing up again
-- If signup works, the problem was the trigger
-- You can re-enable it later after fixing the root cause