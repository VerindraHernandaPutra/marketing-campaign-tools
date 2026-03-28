import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase Client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
// We use the service role key to bypass RLS since this endpoint receives public anonymous clicks
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  const url = new URL(req.url);
  const clickId = url.searchParams.get('id');

  if (!clickId) {
    return new Response('Missing link ID', { status: 400 });
  }

  // 1. Find the exact link tracking record
  const { data: linkRecord, error } = await supabase
    .from('link_clicks')
    .select('*')
    .eq('id', clickId)
    .single();

  if (error || !linkRecord) {
    console.error("Link not found or error:", error);
    // If not found, realistically we can't redirect them anywhere, so return 404
    return new Response('Link not found', { status: 404 });
  }

  // 2. Increment clicks in DB
  const { error: updateError } = await supabase
    .from('link_clicks')
    .update({ clicks: linkRecord.clicks + 1 })
    .eq('id', clickId);

  if (updateError) {
      console.error("Failed to increment click metric:", updateError);
  } else {
      console.log(`Successfully recorded click for Campaign: ${linkRecord.campaign_id}, Platform: ${linkRecord.platform}`);
  }

  // 3. Redirect user to the original destination
  return new Response(null, {
    status: 302,
    headers: {
      Location: linkRecord.original_url,
    },
  });
});
