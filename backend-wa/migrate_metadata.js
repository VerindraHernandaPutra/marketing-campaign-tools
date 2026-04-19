import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrate() {
    console.log("Adding metadata column to whatsapp_outbox...");
    // Since supabase-js doesn't support raw queries directly easily without RPC,
    // wait, we can't do ALTER TABLE natively with supabase-js unless we use rpc('execute_sql').
    // Let's just create a SQL file and the user can run it, OR I use rpc if they have one.
    console.log("Please run this in your Supabase SQL Editor:");
    console.log("ALTER TABLE public.whatsapp_outbox ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;");
}
migrate();
