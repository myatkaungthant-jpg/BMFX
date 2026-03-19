-- BATCH 1: POSTS
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

-- BATCH 2: LIKES (Run these separately if it timeouts)
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- BATCH 3: COMMENTS (Run these separately if it timeouts)
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- BATCH 4: USER PROGRESS
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);

-- DONE
COMMENT ON TABLE public.posts IS 'Optimized with foreign key indices - 2026-03-20';
