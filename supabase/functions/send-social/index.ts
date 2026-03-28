import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const ayrshareKey = Deno.env.get('AYRSHARE_API_KEY') || '';

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record || !record.content || !record.platforms || record.platforms.length === 0) {
      return new Response('Missing required fields in webhook payload', { status: 400 });
    }

    const { id, content, platforms, media_urls } = record;

    const ayrsharePayload: any = {
        post: content,
        platforms: platforms,
        shortenLinks: true
    };

    if (media_urls && Array.isArray(media_urls) && media_urls.length > 0) {
        ayrsharePayload.mediaUrls = media_urls;
    }

    const ayrshareResponse = await fetch('https://app.ayrshare.com/api/post', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ayrshareKey}`
        },
        body: JSON.stringify(ayrsharePayload)
    });

    const result = await ayrshareResponse.json();

    if (!ayrshareResponse.ok || result.status === 'error') {
        console.error("Ayrshare Error:", result);
        await supabase.from('social_posts').update({ 
            status: 'failed', 
            response_data: result
        }).eq('id', id);

        return new Response(JSON.stringify({ error: 'Ayrshare failed', details: result }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Success
    await supabase.from('social_posts').update({ 
        status: 'sent', 
        response_data: result
    }).eq('id', id);

    return new Response(JSON.stringify({ success: true, refId: result.refId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
