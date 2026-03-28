-- Create the table to store multi-tenant OAuth integrations
CREATE TABLE IF NOT EXISTS public.organization_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'facebook_page', 'instagram_business', 'whatsapp', 'resend_domain'
    provider_account_id TEXT NOT NULL, -- The Facebook Page ID or Instagram User ID
    access_token TEXT NOT NULL, -- The long-lived Page Token or WhatsApp API Token
    refresh_token TEXT, -- Optional, mostly used for temporary tokens
    token_expires_at TIMESTAMPTZ, -- Not always needed for Facebook permanent tokens
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active', -- 'active', 'expired', 'revoked'
    metadata JSONB DEFAULT '{}'::jsonb, -- Store page name, profile pic url, etc.
    
    -- Ensure an organization can't accidentally connect the exact same page twice
    UNIQUE (organization_id, platform, provider_account_id)
);

-- Turn on Row Level Security
ALTER TABLE public.organization_integrations ENABLE ROW LEVEL SECURITY;

-- Allow users to read integratons belonging to their organization
CREATE POLICY "Users can read their organization's integrations" 
ON public.organization_integrations 
FOR SELECT 
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
);

-- Allow admins to insert integrations
CREATE POLICY "Admins can insert their organization's integrations" 
ON public.organization_integrations 
FOR INSERT 
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Allow admins to delete integrations (disconnect page)
CREATE POLICY "Admins can delete their organization's integrations" 
ON public.organization_integrations 
FOR DELETE 
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);
