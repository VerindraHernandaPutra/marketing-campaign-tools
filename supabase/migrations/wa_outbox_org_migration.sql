-- Add organization_id to link outgoing messages to the respective tenant

ALTER TABLE public.whatsapp_outbox 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- If you have existing data and want to force the column to be NOT NULL,
-- you must first populate it or delete orphaned rows. 
-- For a fresh integration, it's safe to just enforce it:
-- ALTER TABLE public.whatsapp_outbox ALTER COLUMN organization_id SET NOT NULL;

-- Update RLS Policies
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.whatsapp_outbox;
CREATE POLICY "Authenticated users can insert messages"
ON public.whatsapp_outbox FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.whatsapp_outbox;
CREATE POLICY "Authenticated users can view messages"
ON public.whatsapp_outbox FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
);
