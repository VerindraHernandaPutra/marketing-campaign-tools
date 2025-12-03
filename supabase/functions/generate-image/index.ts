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
    const { params } = await req.json()

    if (!params || !params.subject) {
      throw new Error('Missing required parameters (subject)')
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('Missing OpenAI API Key')
    }

    // --- 1. Smart Aspect Ratio & Size Mapping ---
    // DALL-E 3 currently supports specific sizes: 1024x1024, 1792x1024, 1024x1792.
    // If 'custom' is selected, we map to the closest supported aspect ratio to prevent API errors,
    // while instructing the AI about the intended composition.
    
    let size = "1024x1024"; // Default Square
    let compositionInstruction = "";

    if (params.aspectRatio === 'landscape') {
        size = "1792x1024";
    } else if (params.aspectRatio === 'portrait') {
        size = "1024x1792";
    } else if (params.aspectRatio === 'custom' && params.width && params.height) {
        // Simple logic to pick the best DALL-E 3 container
        const ratio = params.width / params.height;
        if (ratio > 1.2) {
            size = "1792x1024"; // Wide
            compositionInstruction = `(Intended for wide custom crop: ${params.width}x${params.height})`;
        } else if (ratio < 0.8) {
            size = "1024x1792"; // Tall
            compositionInstruction = `(Intended for tall custom crop: ${params.width}x${params.height})`;
        } else {
            size = "1024x1024"; // Square-ish
            compositionInstruction = `(Intended for custom square crop: ${params.width}x${params.height})`;
        }
    }

    // --- 2. Construct Advanced Prompt ---
    let detailedPrompt = `
      Create an image with the following specifications:
      - **Subject**: ${params.subject}
      - **Theme/Style**: ${params.theme || 'Realistic'}
    `.trim();

    // Adding precision details
    if (params.background) detailedPrompt += `\n- **Background**: ${params.background}`;
    if (params.mood) detailedPrompt += `\n- **Mood/Atmosphere**: ${params.mood}`;
    if (params.lighting) detailedPrompt += `\n- **Lighting**: ${params.lighting}`;
    
    // Merge explicit composition setting with our custom size hint
    let comp = params.composition || "";
    if (compositionInstruction) comp += " " + compositionInstruction;
    if (comp) detailedPrompt += `\n- **Camera/Composition**: ${comp}`;

    if (params.colorPalette) detailedPrompt += `\n- **Color Palette**: ${params.colorPalette}`;
    if (params.texture) detailedPrompt += `\n- **Texture/Material**: ${params.texture}`;
    if (params.purpose) detailedPrompt += `\n- **Context/Purpose**: ${params.purpose}`;
    
    if (params.negativePrompt) {
      detailedPrompt += `\n- **Negative Prompt (AVOID THESE)**: ${params.negativePrompt} (Ensure these elements do NOT appear)`;
    }

    detailedPrompt += `\n\nEnsure the image is high quality, visually striking, and strictly follows the details above.`;

    console.log("Generated Prompt:", detailedPrompt);
    console.log("Config:", { size, quality: params.quality || 'standard' });

    // --- 3. Call OpenAI DALL-E 3 ---
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
        size: size,
        response_format: "b64_json",
        quality: params.quality || "standard"
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