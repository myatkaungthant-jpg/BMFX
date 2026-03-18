-- Fix for function overloading ambiguity
-- Drop the old version of the function that only took one argument
DROP FUNCTION IF EXISTS public.decrement_user_credit(user_uuid UUID);

-- Re-ensure the multi-parameter version is the only one (with the correct signature)
CREATE OR REPLACE FUNCTION public.decrement_user_credit(user_uuid UUID, amount INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
    -- Update the credits if they are greater than or equal to the amount
    UPDATE public.user_credits
    SET daily_credits = daily_credits - amount
    WHERE user_id = user_uuid AND daily_credits >= amount;
 
    -- If no row was updated (either user doesn't exist or insufficient credits), throw error
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient credits' USING ERRCODE = 'P0002';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
