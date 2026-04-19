ALTER TABLE public.whatsapp_outbox ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
