import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserBody {
  email: string;
  password?: string;
  fullName: string;
  organizationId: string;
  role: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Initialize Supabase Admin Client (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, fullName, organizationId, role } = await req.json() as CreateUserBody

    // 2. Create User in Auth System
    // We auto-confirm the email since an admin is creating it.
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || undefined, // Allow empty password (will require reset flow if not provided, though typically required here)
      email_confirm: true, 
      user_metadata: { full_name: fullName }
    })

    if (createError) throw createError

    if (!user.user) throw new Error("Failed to create user object")

    // 3. Add to Organization
    // We wait 1s to ensure the Profile trigger has run (race condition safety)
    await new Promise(r => setTimeout(r, 1000));

    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: user.user.id,
        role: role,
        status: 'active'
      })

    if (memberError) {
        // Fallback: If profile trigger was slow, retry once
        await new Promise(r => setTimeout(r, 1000));
        const { error: retryError } = await supabaseAdmin
            .from('organization_members')
            .insert({
                organization_id: organizationId,
                user_id: user.user.id,
                role: role,
                status: 'active'
            })
        if (retryError) throw retryError;
    }

    return new Response(JSON.stringify({ user: user.user, message: "User created and assigned!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})