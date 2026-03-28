import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// These must be set via: npx supabase secrets set META_CLIENT_ID=... META_CLIENT_SECRET=... META_REDIRECT_URI=...
const META_CLIENT_ID = Deno.env.get('META_CLIENT_ID') || '';
const META_CLIENT_SECRET = Deno.env.get('META_CLIENT_SECRET') || '';

// The exact same redirect URI registered in Meta App AND used in the frontend
// E.g., https://YOUR-PROJECT.supabase.co/functions/v1/meta-oauth
const META_REDIRECT_URI = Deno.env.get('META_REDIRECT_URI') || '';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const orgId = url.searchParams.get('state'); // We passed currentOrgId in the 'state' param!

    if (!code || !orgId) {
      throw new Error(`Missing 'code' or 'state' (orgId) parameter.`);
    }

    // 1. Exchange the temporary code for a short-lived user access token
    const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${META_CLIENT_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&client_secret=${META_CLIENT_SECRET}&code=${code}`);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
       console.error("Facebook Token Error: ", tokenData.error);
       throw new Error(`Facebook OAuth failed: ${tokenData.error.message}`);
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Exchange the short-lived token for a LONG-lived user token (lasts 60 days)
    const longLivedResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_CLIENT_ID}&client_secret=${META_CLIENT_SECRET}&fb_exchange_token=${shortLivedToken}`);
    const longLivedData = await longLivedResponse.json();
    const longToken = longLivedData.access_token;

    // 3. To send messages/read comments, we need "Page Access Tokens", not the "User Token"
    // So we fetch the list of Pages the user manages to get the permanent Page Tokens.
    const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}`);
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("No Facebook Pages found for this user account.");
    }

    // Connect securely to DB
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // 4. Save EACH page token into our multi-tenant 'organization_integrations' table
    for (const page of pagesData.data) {
        
        // Let's also find connected Instagram accounts for this page so we can record them too
        const igResponse = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
        const igData = await igResponse.json();
        const igAccountId = igData.instagram_business_account?.id;

        // Upsert Facebook Page
        await supabaseAdmin.from('organization_integrations').upsert({
            organization_id: orgId,
            platform: 'facebook_page',
            provider_account_id: page.id,
            access_token: page.access_token, // This token never expires
            metadata: { name: page.name, category: page.category }
        }, { onConflict: 'organization_id, platform, provider_account_id' });

        // Upsert connected Instagram Business profile (using the SAME page access token!)
        if (igAccountId) {
            await supabaseAdmin.from('organization_integrations').upsert({
                organization_id: orgId,
                platform: 'instagram_business',
                provider_account_id: igAccountId,
                access_token: page.access_token, 
                metadata: { facebook_page_id: page.id, facebook_page_name: page.name }
            }, { onConflict: 'organization_id, platform, provider_account_id' });
        }
    }

    // Redirect the user back to the application Integrations dashboard
    // Read the FRONTEND fallback url from env, defaults to localhost
    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
    return Response.redirect(`${FRONTEND_URL}/integrations?success=true`, 302);

  } catch (error: any) {
    console.error("OAuth edge function error:", error);
    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
    // Redirect back to app with an error message
    return Response.redirect(`${FRONTEND_URL}/integrations?error=${encodeURIComponent(error.message)}`, 302);
  }
});
