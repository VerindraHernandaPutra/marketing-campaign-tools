import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret, accept, accept-language, cache-control, pragma",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // Ensure only our database webhook (or trusted callers) can trigger sends.
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

    const { id, phone, message, media_urls, organization_id } = record;

    if (!organization_id) {
        throw new Error("Missing organization_id in record");
    }

    // 1. Fetch the Fonnte Integration for this organization
    const { data: integration, error: intError } = await supabase
        .from('organization_integrations')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('platform', 'whatsapp')
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (intError || !integration || !integration.access_token) {
        throw new Error('No Fonnte integration found for this organization');
    }

    const fonnteToken = integration.access_token;
    const targetPhone = phone.replace(/\D/g, ''); // Ensure digits only

    // 2. Dispatch to Fonnte API
    const formData = new URLSearchParams();
    formData.append('target', targetPhone);
    formData.append('message', message);
    formData.append('type_bot', 'False');
    
    // Add media if exists (using first media URL for now)
    if (media_urls && Array.isArray(media_urls) && media_urls.length > 0) {
        formData.append('url', media_urls[0]);
        formData.append('filename', 'campaign-media');
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteToken,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const raw = await response.text();
    let result: any;
    try {
      result = raw ? JSON.parse(raw) : null;
    } catch {
      result = { status: false, reason: raw || `HTTP ${response.status}` };
    }

    if (!result.status) {
        console.error("Fonnte Error:", result);
        await supabase.from('whatsapp_outbox').update({ 
            status: 'failed', 
            response_data: result
        }).eq('id', id);

        return new Response(JSON.stringify({ error: 'Fonnte failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Success
    await supabase.from('whatsapp_outbox').update({ 
        status: 'sent', 
        response_data: result
    }).eq('id', id);

    return new Response(JSON.stringify({ success: true, id: result.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("Fonnte worker error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});