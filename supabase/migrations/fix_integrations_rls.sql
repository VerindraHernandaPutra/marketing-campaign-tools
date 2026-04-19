-- The current insert policy strictly requires role = 'admin', preventing 'operator' from setting up WhatsApp natively

DROP POLICY IF EXISTS "Admins can insert their organization's integrations" ON public.organization_integrations;
CREATE POLICY "Admins and Operators can insert integrations" 
ON public.organization_integrations 
FOR INSERT 
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'operator')
    )
);

DROP POLICY IF EXISTS "Admins can delete their organization's integrations" ON public.organization_integrations;
CREATE POLICY "Admins and Operators can delete integrations" 
ON public.organization_integrations 
FOR DELETE 
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'operator')
    )
);

DROP POLICY IF EXISTS "Admins can update their organization's integrations" ON public.organization_integrations;
CREATE POLICY "Admins and Operators can update integrations" 
ON public.organization_integrations 
FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'operator')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'operator')
    )
);
