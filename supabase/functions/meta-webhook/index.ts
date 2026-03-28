import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Ensure you set this in Supabase Vault: npx supabase secrets set --env-file .env META_VERIFY_TOKEN=your_secure_random_string
const META_VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'marketing-tool-verify-token-123';

serve(async (req: Request) => {
  // Handle CORS for browser requests (though Meta Webhooks usually don't need CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Handle Meta's GET request (Verification step)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
      console.log('Meta Webhook Verified!');
      // Meta requires returning JUST the challenge integer
      return new Response(challenge, { status: 200 }); 
    } else {
      console.error('Failed Meta Webhook Verification. Token mismatch.');
      return new Response('Forbidden', { status: 403 });
    }
  }

  // Handle incoming POST requests from Meta (The actual messages & events)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('Incoming Meta Webhook Events:', JSON.stringify(body, null, 2));

      // Check if it's an Instagram or Messenger page event
      if (body.object === 'page' || body.object === 'instagram') {
        
        // Connect to our Supabase database using the Service Role Key to insert the message
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Iterate over all entries (there may be multiple)
        for (const entry of body.entry) {
            // Iterate over all messaging events in the entry
            const webhookEvents = entry.messaging || [];
            
            for (const event of webhookEvents) {
                // If this is a real message 
                if (event.message && !event.message.is_echo) {
                    const senderId = event.sender.id;
                    const recipientId = event.recipient.id;
                    const text = event.message.text;
                    const platform = body.object === 'instagram' ? 'instagram' : 'facebook';

                    console.log(`Received ${platform} message from ${senderId}: ${text}`);

                    // Save the incoming message to our database.
                    // IMPORTANT: Getting this message opens a 24-hour reply window to this senderId!
                    const { error } = await supabaseAdmin
                        .from('social_messages')
                        .insert({
                            platform: platform,
                            sender_id: senderId,
                            recipient_id: recipientId, // Your Page ID
                            message_text: text,
                            direction: 'inbound',
                            // The 24-hour window starts NOW
                            reply_window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                        });

                    if (error) {
                        console.error('Error saving message to Supabase:', error);
                    }
                }
            }
        }
        
        // Meta ALWAYS requires a 200 OK immediately
        return new Response('EVENT_RECEIVED', { status: 200 });
      } else {
        // Return a '404 Not Found' if event is not from a page subscription
        return new Response('Not Found', { status: 404 });
      }
    } catch (e) {
      console.error('Webhook error:', e);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
})
