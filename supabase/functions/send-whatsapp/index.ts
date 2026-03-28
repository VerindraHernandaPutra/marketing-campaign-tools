import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Twilio Config
const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER') || '';

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record || !record.phone || !record.message) {
      return new Response('Missing required fields in webhook payload', { status: 400 });
    }

    const { id, phone, message, media_urls } = record;

    let targetPhone = phone.replace(/\D/g, ''); // Ensure digits only
    if (!targetPhone.startsWith('whatsapp:')) {
      targetPhone = `whatsapp:+${targetPhone}`;
    }

    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    
    // Construct Form Data for Twilio
    const formData = new URLSearchParams();
    formData.append('To', targetPhone);
    formData.append('From', `whatsapp:${twilioPhone}`);
    formData.append('Body', message);

    if (media_urls && Array.isArray(media_urls) && media_urls.length > 0) {
      media_urls.forEach((url) => {
        formData.append('MediaUrl', url);
      });
    }

    // Call Twilio API using Deno fetch
    const twilioResponse = await fetch(twilioEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`
      },
      body: formData.toString()
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
        console.error("Twilio Error:", twilioResult);
        await supabase.from('whatsapp_outbox').update({ 
            status: 'failed', 
            error_message: twilioResult.message || 'Unknown error'
        }).eq('id', id);

        return new Response(JSON.stringify({ error: 'Twilio failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Success
    await supabase.from('whatsapp_outbox').update({ 
        status: 'sent', 
        error_message: null
    }).eq('id', id);

    return new Response(JSON.stringify({ success: true, sid: twilioResult.sid }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});