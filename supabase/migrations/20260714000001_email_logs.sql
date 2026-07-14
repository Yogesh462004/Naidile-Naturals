-- Create email_logs table for transactional email tracking & audit trails
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g. 'order_confirmed', 'welcome'
    html_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'simulated', -- 'sent', 'failed', 'simulated'
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Turn on RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all email logs
CREATE POLICY "Admins can view email logs"
    ON public.email_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Allow service roles / authenticated to insert logs
CREATE POLICY "Allow insert email logs"
    ON public.email_logs
    FOR INSERT
    TO public
    WITH CHECK (true);
