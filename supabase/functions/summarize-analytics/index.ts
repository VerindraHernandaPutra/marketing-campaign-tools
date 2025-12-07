import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { analyticsData } = await req.json()
    const openAiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAiKey) {
      throw new Error('Missing OpenAI API Key')
    }

    const prompt = `
      You are a Senior Marketing Data Analyst. 
      Analyze the following performance data for the requested time period:
      ${JSON.stringify(analyticsData)}

      Instructions:
      1. Provide a concise 3-4 sentence summary suitable for a marketing executive.
      2. Identify the strongest performing metric and specific campaign.
      3. Identify any concerning trends (e.g., if clicks are down).
      4. Provide 1 specific, actionable recommendation to improve results next week.
      
      Tone: Professional, insightful, and action-oriented. Do not use markdown bolding, just plain text.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', 
        messages: [
          { role: 'system', content: 'You are a helpful marketing assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    })

    const data = await response.json()
    
    if (data.error) {
      console.error('OpenAI Error:', data.error);
      throw new Error(data.error.message);
    }

    const summary = data.choices[0].message.content;

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    // FIX: Safely handle the unknown error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(errorMessage);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})