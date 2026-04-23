-- Run this in your Supabase SQL Editor to sync any missing agents
INSERT INTO public.profiles (id, full_name, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', 'Agent ' || substr(id::text, 1, 5)),
  'FIELD_AGENT'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
