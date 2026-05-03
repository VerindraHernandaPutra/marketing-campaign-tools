import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret, accept, accept-language, cache-control, pragma",
};

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // 2. Validate Webhook Secret
    const expectedSecret = Deno.env.get("WH_OUTBOX_WEBHOOK_SECRET") || "";
    if (expectedSecret) {
      const providedSecret = req.headers.get("x-webhook-secret") || "";
      if (!providedSecret || providedSecret !== expectedSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = await req.json();
    const record = payload.record;

    if (!record || !record.phone || !record.message) {
      return new Response('Missing required fields in webhook payload', { status: 400 });
    }

    const { id, phone, message, metadata, organization_id } = record;

    if (!organization_id) {
        throw new Error("Missing organization_id in record");
    }

    // 3. Fetch the Meta WhatsApp Integration for this organization
    const { data: integration, error: intError } = await supabase
        .from('organization_integrations')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('platform', 'whatsapp') // Make sure this matches how you save Meta WA integrations
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (intError || !integration || !integration.access_token) {
        throw new Error('No WhatsApp Meta integration found for this organization');
    }

    const phoneId = integration.provider_account_id;
    const accessToken = integration.access_token;
    const cleanNumber = phone.replace(/[^\d]/g, '');

    // 4. Get Organization Name (for templates)
    const { data: orgData } = await supabase.from('organizations').select('name').eq('id', organization_id).single();
    const orgName = orgData ? orgData.name : 'Your Organization';

    // 5. Construct Meta API Payload
    const messagePayload: Record<string, unknown> = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanNumber
    };

    const taskMetadata = metadata || {};

    if (taskMetadata.template_name) {
        messagePayload.type = 'template';
        messagePayload.template = {
            name: taskMetadata.template_name,
            language: { code: taskMetadata.template_language || 'en_US' }
        };
        
        const pCount = taskMetadata.param_count ?? 0;
        if (pCount > 0) {
            // Template params must not contain newlines — join title and content with colon
            const titlePart = taskMetadata.title ? String(taskMetadata.title).trim() : '';
            const contentPart = taskMetadata.content ? String(taskMetadata.content).trim() : '';
            const cleanMessage = [titlePart, contentPart].filter(Boolean).join(' | ');

            const params = [];
            if (pCount >= 2) {
                params.push({ type: "text", text: orgName });
                params.push({ type: "text", text: cleanMessage || orgName });
            } else {
                params.push({ type: "text", text: cleanMessage || orgName });
            }
            messagePayload.template.components = [
                { type: "body", parameters: params }
            ];
        }
    } else {
        messagePayload.type = 'text';
        messagePayload.text = { body: message };
    }

    // 6. Dispatch to Meta Graph API
    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload)
    });

    const result = await response.json();

    // 7. Handle Errors from Meta
    if (!response.ok || result.error) {
        console.error("Meta Graph API Error:", result.error || result);
        await supabase.from('whatsapp_outbox').update({ 
            status: 'failed', 
            response_data: result
        }).eq('id', id);

        return new Response(JSON.stringify({ error: result.error?.message || 'Meta API failed' }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // 8. Success
    await supabase.from('whatsapp_outbox').update({ 
        status: 'sent', 
        response_data: result
    }).eq('id', id);

    const msgId = result.messages && result.messages[0] ? result.messages[0].id : 'unknown';

    return new Response(JSON.stringify({ success: true, message_id: msgId }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    console.error("WhatsApp worker error:", error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});