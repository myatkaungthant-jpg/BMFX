-- Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  image_urls text[] DEFAULT '{}',
  is_admin_post boolean DEFAULT false NOT NULL
);

-- Likes Table
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Posts Policies
CREATE POLICY "All authenticated users can Read all posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can Insert posts with no images"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    (image_urls IS NULL OR array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) = 0)
  );

CREATE POLICY "Only users with role: 'admin' can Insert posts with images"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    array_length(image_urls, 1) > 0 AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Likes Policies
CREATE POLICY "All authenticated users can Read all likes"
  ON public.likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert their own likes"
  ON public.likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own likes"
  ON public.likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "All authenticated users can Read all comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert their own comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Storage Bucket for post-images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access to post-images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'post-images');

CREATE POLICY "Admins can upload to post-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
