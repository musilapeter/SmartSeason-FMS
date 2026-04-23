-- ============================================================
-- Fix RLS policies for admin access to profiles
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Check what profiles exist
SELECT id, full_name, role, created_at FROM public.profiles;

-- Step 2: Sync any auth users missing from profiles
INSERT INTO public.profiles (id, full_name, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', 'Agent ' || substr(id::text, 1, 8)),
  COALESCE(NULLIF(raw_user_meta_data->>'role', ''), 'FIELD_AGENT')::public.user_role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Drop the broken self-referencing admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Step 4: Recreate using auth.jwt() instead of self-referencing query
-- This avoids the circular RLS evaluation problem entirely
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    (auth.jwt() ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND (u.raw_user_meta_data ->> 'role') = 'ADMIN'
    )
    OR auth.uid() = id
  );

-- Step 5: Verify profiles are visible
SELECT id, full_name, role FROM public.profiles;
