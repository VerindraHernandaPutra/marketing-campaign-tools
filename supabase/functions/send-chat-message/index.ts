import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept, accept-language, cache-control, pragma",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Authenticate the user making the request
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { conversationId, content, mediaUrl } = await req.json();

    if (!conversationId || (!content && !mediaUrl)) {
      throw new Error("Missing required payload fields");
    }

    // 1. Fetch the conversation so we know where to send it
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
        throw new Error("Conversation not found");
    }

    // 1b. Authorize: caller must be a member of the conversation's organization.
    // (This is required because this function uses the service role key, which bypasses RLS.)
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", conversation.organization_id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. We need the Page Token for the organization
    const { data: integration, error: intError } = await supabase
        .from('organization_integrations')
        .select('*')
        .eq('organization_id', conversation.organization_id)
        .ilike('platform', conversation.platform === 'messenger' ? 'facebook%' : `${conversation.platform}%`)
        .limit(1)
        .single();
    
    if (intError || !integration || !integration.access_token) {
        throw new Error(`No access token found for ${conversation.platform}`);
    }

    const accessToken = integration.access_token;
    const externalId = conversation.external_contact_id;
    let metaResponse = null;

    // 3. Dispatch to Meta API
    if (conversation.platform === 'messenger' || conversation.platform === 'instagram') {
        const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;
        
        // Facebook API requires sending attachment and string text separately.
        // First we dispatch the image attachment
        if (mediaUrl) {
           const mediaPayload = {
               recipient: { id: externalId },
               message: {
                   attachment: {
                       type: "image",
                       payload: { url: mediaUrl, is_reusable: false }
                   }
               }
           };
           const mediaRes = await fetch(url, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(mediaPayload)
           });
           metaResponse = await mediaRes.json();
           if (metaResponse.error) {
              console.error("Meta Graph Media Error:", metaResponse.error);
              throw new Error(metaResponse.error.message);
           }
        }

        // Then we dispatch the text caption
        if (content && content.trim() !== '') {
           const textPayload = {
               recipient: { id: externalId },
               message: { text: content }
           };
           const textRes = await fetch(url, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(textPayload)
           });
           const textJson = await textRes.json();
           if (textJson.error) {
              console.error("Meta Graph Text Error:", textJson.error);
              throw new Error(textJson.error.message);
           }
           
           // Keep the latest response for message ID storing
           metaResponse = textJson;
        }

    } else if (conversation.platform === 'whatsapp') {
        // Fonnte API — no "Bearer" prefix, just the raw token
        const fonnteToken = integration.access_token;
        const targetPhone = externalId; // customer's phone number

        // Send image if present
        if (mediaUrl) {
            const mediaForm = new URLSearchParams();
            mediaForm.append('target', targetPhone);
            mediaForm.append('message', content || '');
            mediaForm.append('url', mediaUrl);
            mediaForm.append('filename', 'image');
            mediaForm.append('type_bot', 'False');

            const mediaRes = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: {
                    'Authorization': fonnteToken,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: mediaForm.toString(),
            });
            const mediaJson = await mediaRes.json();
            if (!mediaJson.status) throw new Error(mediaJson.reason || 'Fonnte failed to send media');
            metaResponse = { message_id: mediaJson.id };
        } else if (content && content.trim() !== '') {
            // Text only
            const textForm = new URLSearchParams();
            textForm.append('target', targetPhone);
            textForm.append('message', content);
            textForm.append('type_bot', 'False');

            const textRes = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: {
                    'Authorization': fonnteToken,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: textForm.toString(),
            });
            const textJson = await textRes.json();
            if (!textJson.status) throw new Error(textJson.reason || 'Fonnte failed to send message');
            metaResponse = { message_id: textJson.id };
        }

    } else {
        throw new Error(`Platform ${conversation.platform} not supported yet in Edge Function dispatcher.`);
    }

    // 4. Save the sent message to database
    const { data: savedMessage, error: insertError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: 'agent',
        content: content,
        media_url: mediaUrl,
        status: 'sent',
        external_message_id: metaResponse.message_id
    }).select().single();

    if (insertError) throw insertError;

    // Update conversation last message time
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);

    return new Response(JSON.stringify(savedMessage), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
