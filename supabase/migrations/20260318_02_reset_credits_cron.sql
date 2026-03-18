-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the nightly reset job
-- '0 17 * * *' = 17:00 UTC = 00:00 Bangkok (GMT+7)
SELECT cron.schedule(
    'reset-bmfx-credits',
    '0 17 * * *',
    $$ UPDATE public.user_credits SET daily_credits = 50 $$
);

/*
-- TO UNSCHEDULE THE JOB:
-- If you need to stop or modify this job later, run the following:
SELECT cron.unschedule('reset-bmfx-credits');
*/
