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
    const { imageBase64, context } = await req.json()

    if (!imageBase64) {
      throw new Error('No image provided')
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('Missing OpenAI API Key')
    }

    const contextPrompt = context 
      ? `IMPORTANT CONTEXT: The target audience matches this description: "${context}". ADAPT THE LANGUAGE, TONE, AND CULTURAL REFERENCES TO FIT THIS AUDIENCE.` 
      : "Target audience: General global audience.";

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional social media marketing expert. 
            Analyze the image provided and generate a catchy, engaging Campaign Title and a Caption (Content).
            
            ${contextPrompt}

            Return ONLY a valid JSON object in this format: { "title": "string", "content": "string" }. 
            Do not add markdown formatting like \`\`\`json.`
          },
          {
            role: 'user',
            content: [
              { type: "text", text: "Generate a marketing title and caption for this image." },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 300,
      }),
    })

    const data = await response.json()
    
    if (data.error) {
      console.error("OpenAI Error:", data.error);
      throw new Error(data.error.message);
    }

    const aiContent = data.choices[0].message.content;
    
    let result;
    try {
      result = JSON.parse(aiContent);
    } catch {
      const cleanJson = aiContent.replace(/```json|```/g, '');
      result = JSON.parse(cleanJson);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})