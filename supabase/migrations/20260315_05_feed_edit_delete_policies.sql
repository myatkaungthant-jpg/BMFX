-- Allow owners and admins to update posts
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

-- Allow owners and admins to delete posts
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

-- Also allow owners and admins to delete comments
CREATE POLICY "Owners and admins can delete comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Also allow owners to update comments
CREATE POLICY "Owners can update their own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
