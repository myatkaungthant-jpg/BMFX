-- Create user_credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    daily_credits INTEGER DEFAULT 50 NOT NULL,
    last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own credit row
CREATE POLICY "Users can view own credits" 
ON public.user_credits 
FOR SELECT 
USING (auth.uid() = user_id);

-- Postgres function to decrement user credit
CREATE OR REPLACE FUNCTION public.decrement_user_credit(user_uuid UUID)
RETURNS void AS $$
BEGIN
    -- Update the credits if they are greater than 0
    UPDATE public.user_credits
    SET daily_credits = daily_credits - 1
    WHERE user_id = user_uuid AND daily_credits > 0;

    -- If no row was updated (either user doesn't exist or credits are 0), throw error
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient credits' USING ERRCODE = 'P0002';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Provision credits for existing users
INSERT INTO public.user_credits (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Function to provision credits for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_credits (user_id)
    VALUES (new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user credits
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_credits();

-- Note: In a real application, you'd also want a mechanism to reset credits daily.
-- This can be done via a Supabase Edge Function or a Postgres Cron job.
