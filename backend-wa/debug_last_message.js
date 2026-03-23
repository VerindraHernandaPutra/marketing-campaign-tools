import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Try to read .env manually since we might be in root or backend-wa
if (fs.existsSync('.env')) dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Credentials missing. Make sure you run this in 'backend-wa' folder where .env is.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debugLastMessage() {
    console.log("Fetching last sent message...");
    const { data, error } = await supabase
        .from('whatsapp_outbox')
        .select('*')
        .eq('status', 'sent')
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Supabase Error:", error);
        return;
    }

    if (data && data.length > 0) {
        const msg = data[0];
        console.log("\n--- LAST MESSAGE ---");
        console.log("ID:", msg.id);
        console.log("Phone:", msg.phone);
        console.log("Created At:", msg.created_at);
        console.log("\n--- META API RESPONSE ---");
        console.dir(msg.response_data, { depth: null, colors: true });

        console.log("\n--- DIAGNOSIS ---");
        if (msg.response_data && msg.response_data.messages) {
            console.log("✅ Meta accepted the request. Message ID:", msg.response_data.messages[0].id);
            console.log("👉 If you didn't receive it, check:");
            console.log("   1. Is the number correct? (Country code included?)");
            console.log("   2. Is the App in 'Development Mode'? If yes, you MUST add the recipient number to 'Test Numbers' in Meta Dashboard.");
            console.log("   3. Does the 'hello_world' template exist in your language 'en_US'?");
        } else {
            console.log("❌ Unexpected response structure.");
        }
    } else {
        console.log("No 'sent' messages found.");
    }
}

debugLastMessage();
