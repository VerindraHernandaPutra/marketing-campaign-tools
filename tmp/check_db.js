import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../backend-email/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in backend-email/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { count: waCount } = await supabase.from('whatsapp_outbox').select('*', { count: 'exact', head: true });
  const { count: socialCount } = await supabase.from('social_posts').select('*', { count: 'exact', head: true });
  const { count: campCount } = await supabase.from('marketing_campaigns').select('*', { count: 'exact', head: true });
  
  console.log("---- DATABASE COUNTS (SERVICE ROLE) ----");
  console.log(`whatsapp_outbox rows: ${waCount}`);
  console.log(`social_posts rows:    ${socialCount}`);
  console.log(`marketing_campaigns:  ${campCount}`);
}

check();
