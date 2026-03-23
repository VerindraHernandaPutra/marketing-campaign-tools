import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testSupabase() {
    console.log("Testing Supabase Connection...");
    try {
        const { data, error } = await supabase.from('whatsapp_outbox').select('*').limit(1);
        if (error) {
            console.error("❌ Error querying whatsapp_outbox:", error.message);
            console.log("👉 Hint: Did you run the 'supabase_schema.sql' in your Supabase SQL Editor?");
        } else {
            console.log("✅ Connection Successful! Found items:", data.length);
        }
    } catch (err) {
        console.error("❌ Unexpected Error:", err.message);
    }
}

testSupabase();
