-- Lessons Table to store dynamic content
CREATE TABLE IF NOT EXISTS public.lessons (
  id text PRIMARY KEY, -- e.g. 'alpha-1', 'alpha-2'
  course_id text NOT NULL, -- e.g. 'alpha', 'sighma'
  lesson_id text NOT NULL, -- e.g. '1', '2'
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage lessons"
  ON public.lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
