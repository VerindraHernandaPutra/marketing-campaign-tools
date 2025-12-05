// [cite: supabase/functions/generate-image/index.ts]
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateImageParams {
  subject: string;
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
    // Explicitly type the incoming JSON body
    const { params } = await req.json() as { params: GenerateImageParams };

    if (!params || !params.subject) {
      throw new Error('Missing required parameters (subject)')
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('Missing OpenAI API Key')
    }

    // --- 1. Aspect Ratio & Size Logic ---
    let size = "1024x1024"; // Default Square
    let compositionNote = "";

    if (params.aspectRatio === 'landscape') {
        size = "1792x1024";
    } else if (params.aspectRatio === 'portrait') {
        size = "1024x1792";
    } else if (params.aspectRatio === 'custom' && params.width && params.height) {
        const ratio = params.width / params.height;
        if (ratio > 1.2) {
            size = "1792x1024"; // Wide bucket
            compositionNote = `(Target composition: Wide ${params.width}x${params.height} crop)`;
        } else if (ratio < 0.8) {
            size = "1024x1792"; // Tall bucket
            compositionNote = `(Target composition: Tall ${params.width}x${params.height} crop)`;
        } else {
            size = "1024x1024"; // Square bucket
            compositionNote = `(Target composition: Square ${params.width}x${params.height} crop)`;
        }
    }

    // --- 2. Construct Advanced Prompt ---
    let detailedPrompt = `Create a high-quality image based on this subject: "${params.subject}".\n`;

    // Artistic & Medium
    if (params.medium) detailedPrompt += `\n- **Art Medium**: ${params.medium}`;
    if (params.style) detailedPrompt += `\n- **Art Style**: ${params.style}`;
    if (params.colorPalette) detailedPrompt += `\n- **Color Palette**: ${params.colorPalette}`;
    if (params.texture) detailedPrompt += `\n- **Texture**: ${params.texture}`;

    // Photography & View
    if (params.medium === 'Photography' || !params.medium) {
        if (params.camera) detailedPrompt += `\n- **Camera**: ${params.camera}`;
        if (params.lens) detailedPrompt += `\n- **Lens**: ${params.lens}`;
    }
    if (params.perspective) detailedPrompt += `\n- **Perspective/View**: ${params.perspective}`;

    // Environment & Atmosphere
    if (params.lighting) detailedPrompt += `\n- **Lighting**: ${params.lighting}`;
    if (params.timeOfDay) detailedPrompt += `\n- **Time of Day**: ${params.timeOfDay}`;
    if (params.weather) detailedPrompt += `\n- **Weather**: ${params.weather}`;
    if (params.mood) detailedPrompt += `\n- **Mood**: ${params.mood}`;
    if (params.background) detailedPrompt += `\n- **Background**: ${params.background}`;

    // Composition & Technical
    let compLine = params.composition || "";
    if (compositionNote) compLine += ` ${compositionNote}`;
    if (compLine) detailedPrompt += `\n- **Composition**: ${compLine}`;
    
    if (params.complexity) detailedPrompt += `\n- **Detail Level**: ${params.complexity}`;

    // Negative Prompt instructions
    if (params.negativePrompt) {
      detailedPrompt += `\n- **Avoid Elements**: ${params.negativePrompt}`;
    }

    detailedPrompt += `\n\nEnsure the image is high quality, visually striking, and strictly follows the details above.`;

    console.log("Generated Prompt:", detailedPrompt);

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