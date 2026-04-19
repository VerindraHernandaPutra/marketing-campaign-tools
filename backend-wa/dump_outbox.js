import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config({ path: '.env' });
else if (fs.existsSync('../.env')) dotenv.config({ path: '../.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('whatsapp_outbox')
        .select('id, phone, status, organization_id, response_data, created_at')
        .order('id', { ascending: false })
        .limit(5);
        
    fs.writeFileSync('outbox_dump.json', JSON.stringify(data, null, 2));
    process.exit(0);
}
check();
