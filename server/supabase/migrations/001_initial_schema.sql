-- ============================================================
-- SmartSeason Field Monitoring System
-- Initial Database Schema Migration
-- ============================================================

-- ─── Custom Enum Types ──────────────────────────────────────

CREATE TYPE user_role AS ENUM ('ADMIN', 'FIELD_AGENT');
CREATE TYPE crop_stage AS ENUM ('Planted', 'Growing', 'Harvested');

-- ─── Profiles ───────────────────────────────────────────────
-- Extends Supabase auth.users with application-specific data

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'FIELD_AGENT',
  full_name   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Fields ─────────────────────────────────────────────────
-- Agricultural fields being monitored

CREATE TABLE fields (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  crop_type         TEXT NOT NULL,
  planting_date     DATE NOT NULL,
  current_stage     crop_stage NOT NULL DEFAULT 'Planted',
  assigned_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Field Updates ──────────────────────────────────────────
-- Timestamped notes and stage snapshots for each field

CREATE TABLE field_updates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id      UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  note          TEXT NOT NULL,
  stage_at_time crop_stage NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────

CREATE INDEX idx_fields_assigned_agent ON fields(assigned_agent_id);
CREATE INDEX idx_field_updates_field_id ON field_updates(field_id);
CREATE INDEX idx_field_updates_created_at ON field_updates(created_at DESC);

-- ─── Row Level Security ─────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_updates ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Fields: agents see their assigned fields
CREATE POLICY "Agents see assigned fields"
  ON fields FOR SELECT
  USING (assigned_agent_id = auth.uid());

-- Fields: admins see all fields
CREATE POLICY "Admins see all fields"
  ON fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

-- Field Updates: viewable if user can see the parent field
CREATE POLICY "View updates for accessible fields"
  ON field_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fields
      WHERE fields.id = field_updates.field_id
        AND (
          fields.assigned_agent_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
          )
        )
    )
  );

-- ─── Auto-create profile on signup (optional trigger) ───────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), 'Unnamed User'),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'role', ''), 'FIELD_AGENT')::public.user_role
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Instead of failing the whole signup process due to a trigger error, 
  -- fallback to a default profile or simply allow the auth user creation.
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, 'Error Creating Profile', 'FIELD_AGENT');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
