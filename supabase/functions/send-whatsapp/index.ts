// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions/deploy
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS (Cross-Origin Resource Sharing) for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get the data sent from the Frontend
    const { message, to } = await req.json()

    // 2. Get Secrets from Supabase Vault (Set these via 'npx supabase secrets set ...')
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    // This is your Twilio Sandbox number (e.g., "whatsapp:+14155238886")
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Missing Twilio API Credentials')
    }

    // 3. Format the phone number for Twilio (must include "whatsapp:" prefix)
    // Ensure 'to' has country code but no spaces/dashes. E.g., "628123456789"
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`

    // 4. Send to Twilio API
    // We use the URL-encoded form data format required by Twilio
    const body = new URLSearchParams({
      To: formattedTo,
      From: formattedFrom,
      Body: message,
    })

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message via Twilio')
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})