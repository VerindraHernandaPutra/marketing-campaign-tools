import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Fonnte sends POST requests for incoming messages
  if (req.method === 'POST') {
    try {
      // Fonnte webhook payload usually comes as application/x-www-form-urlencoded or JSON
      // depending on settings, but we'll try to handle both or default to form data if possible.
      // Actually, standard Fonnte webhooks are flat POST parameters.
      
      const formData = await req.formData();
      const sender = formData.get('sender'); // Customer phone number
      const message = formData.get('message'); // Message content
      const name = formData.get('name'); // Customer name (if available)
      const device = formData.get('device'); // Our connected phone number (from Fonnte)
      
      if (!sender || !message || !device) {
        return new Response('Missing required Fonnte fields', { status: 400 });
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Find the organization linked to this Fonnte device
      // We look up by provider_account_id which we stored as the phone number in IntegrationsWhatsApp.tsx
      const cleanDevice = String(device).replace(/\D/g, '');
      const { data: orgData, error: orgError } = await supabase
        .from('organization_integrations')
        .select('organization_id')
        .eq('provider_account_id', cleanDevice)
        .eq('platform', 'whatsapp')
        .limit(1)
        .single();

      if (orgError || !orgData) {
          console.error(`Organization not found for device: ${cleanDevice}`);
          return new Response('Organization not found', { status: 200 }); // Return 200 so Fonnte doesn't keep retrying
      }

      const organizationId = orgData.organization_id;
      const customerPhone = String(sender).replace(/\D/g, '');
      const customerName = name || customerPhone;

      // 2. Upsert Conversation
      const { data: convData, error: convError } = await supabase.from('conversations').upsert({
          organization_id: organizationId,
          platform: 'whatsapp',
          external_contact_id: customerPhone,
          contact_name: customerName,
          last_message_at: new Date().toISOString()
      }, { onConflict: 'organization_id, platform, external_contact_id' }).select('id').single();

      if (convError || !convData) {
          throw convError || new Error("Failed to upsert conversation");
      }

      // 3. Insert incoming message
      const { error: msgError } = await supabase.from('messages').insert({
          conversation_id: convData.id,
          sender_type: 'contact',
          content: String(message),
          status: 'received'
      });

      if (msgError) throw msgError;

      return new Response('OK', { status: 200 });
    } catch (error: any) {
      console.error("Webhook processing error:", error.message);
      return new Response('Error Processing Request', { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});
