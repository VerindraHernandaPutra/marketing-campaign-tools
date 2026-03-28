-- =========================================================================
-- 1. UNIVERSAL LINK TRACKING TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS link_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_url TEXT NOT NULL,
    campaign_id UUID REFERENCES marketing_campaigns(id),
    platform TEXT,
    clicks INTEGER DEFAULT 0
);

-- Note: For Webhooks, it is 100x easier and more secure to create them 
-- directly via the Supabase Dashboard UI instead of SQL, since you do not 
-- have to hardcode your Service Role Keys into the database functions.
