-- Allow all authenticated users to post with images
DROP POLICY IF EXISTS "All authenticated users can Insert posts with no images" ON public.posts;
DROP POLICY IF EXISTS "Only users with role: 'admin' can Insert posts with images" ON public.posts;

CREATE POLICY "All authenticated users can Insert posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update storage policies
DROP POLICY IF EXISTS "Admins can upload to post-images" ON storage.objects;

CREATE POLICY "Authenticated users can upload to post-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can delete any post image
CREATE POLICY "Admins can delete any post image"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
