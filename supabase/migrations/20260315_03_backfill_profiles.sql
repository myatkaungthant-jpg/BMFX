-- Backfill profiles for existing users
INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  COALESCE(raw_user_meta_data->>'role', 'student')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
