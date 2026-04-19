-- Add campaign attribution columns for channel outbox tables

ALTER TABLE public.whatsapp_outbox
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_campaign_id
ON public.whatsapp_outbox (campaign_id);

ALTER TABLE public.social_posts
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_campaign_id
ON public.social_posts (campaign_id);
