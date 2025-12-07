// [cite: supabase/functions/generate-image/index.ts]
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateImageParams {
  subject: string;
  referenceImage?: string; 
  aspectRatio?: string;
  width?: number;
  height?: number;
  quality?: string;
  medium?: string;
  style?: string;
  colorPalette?: string;
  texture?: string;
  camera?: string;
  lens?: string;
  perspective?: string;
  lighting?: string;
  timeOfDay?: string;
  weather?: string;
  mood?: string;
  background?: string;
  composition?: string;
  complexity?: string;
  negativePrompt?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { params } = await req.json() as { params: GenerateImageParams };

    if (!params) {
      throw new Error('Missing parameters')
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('Missing OpenAI API Key')
    }

    // --- 1. Aspect Ratio & Size Logic ---
    let size = "1024x1024";

    if (params.aspectRatio === 'landscape') {
        size = "1792x1024";
    } else if (params.aspectRatio === 'portrait') {
        size = "1024x1792";
    }

    // --- 2. Construct Prompt Logic ---
    let finalPrompt = "";

    if (params.referenceImage) {
        console.log("Processing reference image...");
        const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o', 
                messages: [
                    {
                        role: "system",
                        content: "Analyze the image. Describe it in extreme detail (subject, composition, lighting, style, colors) so DALL-E 3 can recreate it. Incorporate the user's request. Return ONLY the prompt."
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `User Request: ${params.subject || "Copy this image style"}` },
                            { type: "image_url", image_url: { url: params.referenceImage } }
                        ]
                    }
                ],
                max_tokens: 300
            })
        });

        const visionData = await visionResponse.json();
        
        if (visionData.error) {
            console.error("Vision Error:", visionData.error);
            throw new Error(`Vision AI failed: ${visionData.error.message}`);
        }
        
        if (!visionData.choices || !visionData.choices[0]) {
             throw new Error("Vision AI returned no description.");
        }

        finalPrompt = visionData.choices[0].message.content;
        
        // Append aspect ratio if needed
        if (params.aspectRatio !== 'square') finalPrompt += ` --ar ${params.aspectRatio}`; 
        
    } else {
        // Fallback if no subject provided in text-only mode
        const safeSubject = params.subject || "A creative artistic composition";

        finalPrompt = `Create a high-quality image based on: "${safeSubject}".\n`;

        if (params.medium) finalPrompt += `\n- **Medium**: ${params.medium}`;
        if (params.style) finalPrompt += `\n- **Style**: ${params.style}`;
        if (params.colorPalette) finalPrompt += `\n- **Colors**: ${params.colorPalette}`;
        if (params.lighting) finalPrompt += `\n- **Lighting**: ${params.lighting}`;
        if (params.mood) finalPrompt += `\n- **Mood**: ${params.mood}`;
        
        finalPrompt += `\n\nEnsure high quality and detail.`;
    }

    console.log("Final DALL-E Prompt:", finalPrompt.substring(0, 100) + "...");

    // --- 3. Call OpenAI DALL-E 3 ---
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: finalPrompt,
        n: 1,
        size: size,
        response_format: "b64_json",
        quality: params.quality || "standard"
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error("DALL-E Error:", data.error);
      // Return 200 with error field so frontend can display it nicely instead of generic 500
      return new Response(JSON.stringify({ error: data.error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const imageBase64 = data.data[0].b64_json;

    return new Response(JSON.stringify({ image: `data:image/png;base64,${imageBase64}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Function Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})