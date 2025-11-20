// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions/deploy
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
  reply_to: string;
  scheduled_at?: string;
  attachments?: {
    filename: string;
    content: string; // FIX: Keep as string (Base64) for raw API calls
    content_id?: string;
    disposition?: string;
  }[];
}

serve(async (req: Request) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, from, scheduledAt, attachments } = await req.json()
    
    console.log("Backend received request:", { to, scheduledAt, hasAttachments: attachments?.length > 0 });

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) throw new Error('Missing Resend API Key')

    const payload: EmailPayload = {
      from: 'onboarding@resend.dev',
      to: [to],
      subject: subject,
      html: html,
      reply_to: from,
    };

    if (scheduledAt) {
      payload.scheduled_at = scheduledAt;
    }

    if (attachments && attachments.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload.attachments = attachments.map((att: any) => ({
        filename: att.filename.replace(/[^a-zA-Z0-9.-]/g, '_'),
        // FIX: Send the Base64 string directly. Do NOT convert to Buffer for the raw API.
        content: att.content, 
        content_id: att.content_id,
        disposition: 'inline',
      }));
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Resend API Error:", data);
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})