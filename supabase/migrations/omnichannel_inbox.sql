-- Create omnichannel_inbox schema
-- Place this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS conversations (
  id uuid default gen_random_uuid() primary key,
  organization_id text not null,
  platform text not null, -- 'whatsapp', 'messenger', 'instagram'
  external_contact_id text not null, -- PSID, Phone Number, or IGID
  contact_name text, -- Captured from webhook if available
  client_id text, -- ID from clients table if linked
  unread_count integer default 0,
  last_message_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Unique constraint so we don't duplicate a thread for the same external ID and platform
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_org_platform_ext 
ON conversations (organization_id, platform, external_contact_id);

CREATE TABLE IF NOT EXISTS messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_type text not null, -- 'contact' (inbound) or 'agent' / 'system' (outbound)
  content text,
  media_url text, -- For images/videos
  status text default 'delivered', -- 'sent', 'delivered', 'read', 'failed'
  external_message_id text, -- Graph API message ID to prevent duplicate webhook processing
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Turn on Realtime for the messages table so the UI updates instantly!
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;

-- RLS FOR CONVERSATIONS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their organization's conversations" 
ON conversations FOR SELECT TO authenticated
USING (true); -- In a real env, filter by auth.uid() mapped to org, but for now allow logged in users.

CREATE POLICY "Users can insert conversations" 
ON conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update conversations" 
ON conversations FOR UPDATE TO authenticated USING (true);


-- RLS FOR MESSAGES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages" 
ON messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert messages" 
ON messages FOR INSERT TO authenticated WITH CHECK (true);
