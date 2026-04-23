-- ============================================================
-- DEFINITIVE FIX: Admin profile visibility
-- Run ALL of this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Create a helper function that bypasses RLS to check admin status
-- This is the standard Supabase pattern for self-referencing policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Drop ALL existing SELECT policies on profiles to start clean
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Step 3: Recreate clean policies using the helper function
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- Step 4: Verify your profiles exist and have correct roles
SELECT id, full_name, role, created_at FROM public.profiles ORDER BY created_at;

-- Step 5: Check how many FIELD_AGENT profiles there are
SELECT count(*) as agent_count FROM public.profiles WHERE role = 'FIELD_AGENT';
