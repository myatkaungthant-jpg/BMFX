-- Create Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  level text,
  duration text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed Data
INSERT INTO public.courses (id, title, description, level, duration, order_index)
VALUES 
  ('alpha', 'Alpha Module', 'Master the core concepts of market structure and liquidity.', 'Beginner', '4h 20m', 1),
  ('sighma', 'Sighma Module', 'Advanced entry models and risk management strategies.', 'Advanced', '2h 15m', 2)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  duration = EXCLUDED.duration,
  order_index = EXCLUDED.order_index;

-- Create Lessons Table if it doesn't exist (fallback)
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

-- Enable RLS on lessons if not already enabled
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Policies for lessons (fallback)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Anyone can view lessons') THEN
        CREATE POLICY "Anyone can view lessons" ON public.lessons FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Admins can manage lessons') THEN
        CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;
END $$;

INSERT INTO public.lessons (id, course_id, lesson_id, title, description, video_url, order_index)
VALUES 
  ('alpha-1', 'alpha', '1', 'Market Structure 101', 'Understanding the foundation of market movements through swing highs and lows.', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 1),
  ('alpha-2', 'alpha', '2', 'Liquidity Concepts', 'Identifying where the big money is resting and how to use it as a magnet.', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 2),
  ('alpha-3', 'alpha', '3', 'Supply & Demand Zones', 'Locating high-probability areas for price reversals and continuations.', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 3),
  ('sighma-1', 'sighma', '1', 'The Sighma Entry Model', 'Our proprietary entry model for high risk-to-reward setups.', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 1)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  order_index = EXCLUDED.order_index;
