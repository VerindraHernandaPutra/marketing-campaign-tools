-- Add ON DELETE CASCADE to foreign keys referencing marketing_campaigns.id

ALTER TABLE email_events DROP CONSTRAINT IF EXISTS email_events_campaign_id_fkey;
ALTER TABLE email_events ADD CONSTRAINT email_events_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE;

ALTER TABLE link_clicks DROP CONSTRAINT IF EXISTS link_clicks_campaign_id_fkey;
ALTER TABLE link_clicks ADD CONSTRAINT link_clicks_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE;

ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_campaign_id_fkey;
ALTER TABLE social_posts ADD CONSTRAINT social_posts_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE;

ALTER TABLE whatsapp_outbox DROP CONSTRAINT IF EXISTS whatsapp_outbox_campaign_id_fkey;
ALTER TABLE whatsapp_outbox ADD CONSTRAINT whatsapp_outbox_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE;
