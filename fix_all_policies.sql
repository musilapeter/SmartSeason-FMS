-- ============================================================
-- Fix ALL RLS policies that check admin status
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Ensure is_admin() exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── FIELDS TABLE: Drop and recreate all policies ───────────

DROP POLICY IF EXISTS "Agents see assigned fields" ON fields;
DROP POLICY IF EXISTS "Admins see all fields" ON fields;
DROP POLICY IF EXISTS "Admins can insert fields" ON fields;
DROP POLICY IF EXISTS "Admins can update fields" ON fields;
DROP POLICY IF EXISTS "Agents can update assigned fields" ON fields;

CREATE POLICY "Agents see assigned fields"
  ON fields FOR SELECT
  USING (assigned_agent_id = auth.uid());

CREATE POLICY "Admins see all fields"
  ON fields FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert fields"
  ON fields FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update fields"
  ON fields FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Agents can update assigned fields"
  ON fields FOR UPDATE
  USING (assigned_agent_id = auth.uid());

-- ─── FIELD_UPDATES TABLE: Drop and recreate all policies ────

DROP POLICY IF EXISTS "View updates for accessible fields" ON field_updates;
DROP POLICY IF EXISTS "Agents can insert field updates" ON field_updates;

CREATE POLICY "View updates for accessible fields"
  ON field_updates FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM fields
      WHERE fields.id = field_updates.field_id
        AND fields.assigned_agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can insert field updates"
  ON field_updates FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM fields
      WHERE fields.id = field_updates.field_id
        AND fields.assigned_agent_id = auth.uid()
    )
  );

-- Verify
SELECT 'All policies updated successfully' AS status;
