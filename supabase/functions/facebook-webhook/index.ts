// Follow this setup guide to integrate the Deno language server with your editor:
// https://supabase.com/docs/guides/functions/local-development
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// You must set this VERIFY_TOKEN in your Supabase Edge Function Secrets
const VERIFY_TOKEN = Deno.env.get('FACEBOOK_VERIFY_TOKEN') || 'my_secure_webhook_token';

serve(async (req) => {
  const url = new URL(req.url)

  // 1. GET Request: Used by Meta to verify the webhook endpoint.
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new Response(challenge, { status: 200 });
    } else {
      return new Response('Verification failed', { status: 403 });
    }
  }

  // 2. POST Request: Used by Meta to send message events.
  if (req.method === 'POST') {
    try {
      const body = await req.json();

      // Check if this is an event from a Page or Instagram subscription
      if (body.object === 'page' || body.object === 'instagram') {
        const platform = body.object === 'instagram' ? 'instagram' : 'messenger';
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Iterate over each entry - there may be multiple if batched
        for (const entry of body.entry) {
          const webhookEvent = entry.messaging[0];
          console.log("Received event:", JSON.stringify(webhookEvent));

          // Get the sender PSID
          const senderPsid = webhookEvent.sender.id;
          const pageId = webhookEvent.recipient.id; // Or you can get it from entry.id

          if (webhookEvent.message && !webhookEvent.message.is_echo) {
             console.log(`Incoming message from PSID: ${senderPsid} to Page ID: ${pageId}`);

             // 3. Automate PSID Collection
             // Attempt to link this PSID to an existing client, or create a new "Anonymous" lead
             // First, we find whose organization this Page belongs to
             const { data: orgData } = await supabase
                .from('organization_integrations')
                .select('organization_id, access_token')
                .eq('provider_account_id', pageId)
                .limit(1)
                .single();

             if (orgData) {
                // Fetch user profile from Meta
                let contactName = undefined;
                try {
                   let profileUrl = '';
                   if (platform === 'instagram') {
                       profileUrl = `https://graph.facebook.com/v19.0/${senderPsid}?fields=name,profile_pic&access_token=${orgData.access_token}`;
                   } else {
                       profileUrl = `https://graph.facebook.com/${senderPsid}?fields=first_name,last_name&access_token=${orgData.access_token}`;
                   }

                   const profileResp = await fetch(profileUrl);
                   const profile = await profileResp.json();
                   
                   if (platform === 'instagram' && profile && profile.name) {
                       contactName = profile.name;
                   } else if (profile && profile.first_name) {
                       contactName = `${profile.first_name} ${profile.last_name || ''}`.trim();
                   }
                } catch (e) {
                   console.error("Failed to fetch profile", e);
                }

                // Upsert Conversation
                const { data: convData } = await supabase.from('conversations').upsert({
                    organization_id: orgData.organization_id,
                    platform: platform,
                    external_contact_id: senderPsid,
                    contact_name: contactName,
                    last_message_at: new Date().toISOString()
                }, { onConflict: 'organization_id, platform, external_contact_id' }).select('id').single();

                if (convData) {
                    // Insert incoming message
                    await supabase.from('messages').insert({
                        conversation_id: convData.id,
                        sender_type: 'contact',
                        content: webhookEvent.message.text || '[Media/Attachment]',
                        external_message_id: webhookEvent.message.mid
                    });
                }
             }

          } else if (webhookEvent.delivery && webhookEvent.delivery.mids) {
             // Handle delivery receipts
             for (const mid of webhookEvent.delivery.mids) {
                await supabase.from('messages').update({ status: 'delivered' }).eq('external_message_id', mid);
             }
          } else if (webhookEvent.read) {
             // Handle read receipts
             console.log("Messages read at watermark:", webhookEvent.read.watermark);
          }
        }
        return new Response('EVENT_RECEIVED', { status: 200 });
      } else {
        return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error(error);
      return new Response('Error Processing Request', { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});
