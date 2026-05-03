-- Add ON DELETE CASCADE to all foreign keys referencing organizations.id
-- so that deleting an organization automatically removes all child records.

-- social_posts
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_organization_id_fkey;
ALTER TABLE social_posts ADD CONSTRAINT social_posts_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- whatsapp_outbox
ALTER TABLE whatsapp_outbox DROP CONSTRAINT IF EXISTS whatsapp_outbox_organization_id_fkey;
ALTER TABLE whatsapp_outbox ADD CONSTRAINT whatsapp_outbox_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- messenger_outbox
ALTER TABLE messenger_outbox DROP CONSTRAINT IF EXISTS messenger_outbox_organization_id_fkey;
ALTER TABLE messenger_outbox ADD CONSTRAINT messenger_outbox_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- marketing_campaigns
ALTER TABLE marketing_campaigns DROP CONSTRAINT IF EXISTS marketing_campaigns_organization_id_fkey;
ALTER TABLE marketing_campaigns ADD CONSTRAINT marketing_campaigns_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- organization_integrations
ALTER TABLE organization_integrations DROP CONSTRAINT IF EXISTS organization_integrations_organization_id_fkey;
ALTER TABLE organization_integrations ADD CONSTRAINT organization_integrations_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- organization_members
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_organization_id_fkey;
ALTER TABLE organization_members ADD CONSTRAINT organization_members_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- clients
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_organization_id_fkey;
ALTER TABLE clients ADD CONSTRAINT clients_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- groups
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_organization_id_fkey;
ALTER TABLE groups ADD CONSTRAINT groups_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- conversations
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_organization_id_fkey;
ALTER TABLE conversations ADD CONSTRAINT conversations_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- projects
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_organization_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
