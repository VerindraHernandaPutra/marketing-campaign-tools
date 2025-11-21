import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // FIX: Accept structured params instead of just 'prompt'
    const { params } = await req.json()

    if (!params || !params.subject) {
      throw new Error('Missing required parameters (subject)')
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('Missing OpenAI API Key')
    }

    // Construct a highly detailed prompt based on the structured JSON
    // This follows the "Best Practice" of using specific attributes to guide generation
    const detailedPrompt = `
      Create an image with the following specifications:
      - **Subject**: ${params.subject}
      - **Theme/Style**: ${params.theme || 'Realistic'}
      - **Background**: ${params.background || 'Neutral studio lighting'}
      - **Mood/Tone**: ${params.mood || 'Professional'}
      - **Purpose/Context**: ${params.purpose || 'General Marketing'}
      
      Ensure the image is high quality, visually striking, and perfectly matches the description above.
    `.trim();

    console.log("Generated Prompt:", detailedPrompt);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: detailedPrompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
        quality: "standard"
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error("OpenAI Error:", data.error);
      throw new Error(data.error.message);
    }

    const imageBase64 = data.data[0].b64_json;

    return new Response(JSON.stringify({ image: `data:image/png;base64,${imageBase64}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})