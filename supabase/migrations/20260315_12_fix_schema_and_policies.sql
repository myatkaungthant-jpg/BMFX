-- 1. Drop all policies on public.posts to allow schema changes
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'posts' AND schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.posts', pol.policyname);
    END LOOP;
END $$;

-- 2. Fix the column type
DO $$ 
BEGIN 
    -- If image_url exists, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='image_url') THEN
        ALTER TABLE public.posts RENAME COLUMN image_url TO image_urls;
    END IF;

    -- If image_urls doesn't exist at all, add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='image_urls') THEN
        ALTER TABLE public.posts ADD COLUMN image_urls text[] DEFAULT '{}';
    END IF;

    -- Ensure it is an array
    IF (SELECT data_type FROM information_schema.columns WHERE table_name='posts' AND column_name='image_urls') = 'text' THEN
        ALTER TABLE public.posts ALTER COLUMN image_urls TYPE text[] USING ARRAY[image_urls];
    END IF;
END $$;

-- 3. Re-create all policies for public.posts

-- SELECT
CREATE POLICY "All authenticated users can Read all posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (true);

-- INSERT (Allow all authenticated users to post)
CREATE POLICY "All authenticated users can Insert posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Owners and admins can update posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE
CREATE POLICY "Owners and admins can delete posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Nudge PostgREST cache refresh
DO $$ 
BEGIN 
    EXECUTE 'COMMENT ON TABLE public.posts IS ''Community posts table - Refreshed at ' || now() || '''' ;
END $$;
