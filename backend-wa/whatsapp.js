import express from 'express';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = 3051;

app.use(cors());

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Twilio Config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; // From: 'whatsapp:+14155238886' (Sandbox)

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
}

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error("FATAL: Missing TWILIO Configuration (SID, Token, or Phone)");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// --- TWILIO SENDER ---
async function sendWhatsAppMessage(to, body, mediaUrls) {
    // Twilio Format: "whatsapp:+1234567890"
    // We assume 'to' from DB is just numbers "62812...", so we prefix it.
    // If it already has '+', strip it first to be safe, then add it back? 
    // Usually Twilio wants "whatsapp:+[CountryCode][Number]"

    // Clean the number: remove all non-digits
    const cleanNumber = to.replace(/[^\d]/g, '');
    const toTwilio = `whatsapp:+${cleanNumber}`; // Twilio requires the + sign for E.164 format

    try {
        const messagePayload = {
            body: body,
            from: TWILIO_PHONE_NUMBER,
            to: toTwilio
        };
        
        // Attach media if provided
        if (mediaUrls && mediaUrls.length > 0) {
            messagePayload.mediaUrl = mediaUrls;
        }

        const message = await client.messages.create(messagePayload);
        return message;
    } catch (error) {
        console.error("Twilio API Error:", error.message);
        throw error;
    }
}

// --- WORKER LOOP ---
async function processQueue() {
    try {
        // 1. Fetch ONE pending message
        const { data: messages, error } = await supabase
            .from('whatsapp_outbox')
            .select('*')
            .eq('status', 'scheduling')
            .limit(1);

        if (error) throw error;
        if (!messages || messages.length === 0) return;

        const messageTask = messages[0];
        console.log(`[Processing] ID: ${messageTask.id}, Phone: ${messageTask.phone}`);

        try {
            // Use the 'message' column content. If empty, default to "Hello World"
            const content = messageTask.message || "Hello from Twilio!";

            const result = await sendWhatsAppMessage(messageTask.phone, content, messageTask.media_urls);

            // 2. Update Status to 'sent'
            await supabase
                .from('whatsapp_outbox')
                .update({
                    status: 'sent',
                    updated_at: new Date().toISOString(),
                    response_data: result
                })
                .eq('id', messageTask.id);

            console.log(`[Success] Message sent to ${messageTask.phone} (SID: ${result.sid})`);

        } catch (sendError) {
            console.error(`[Failed] Could not send to ${messageTask.phone}:`, sendError.message);
            // 3. Update Status to 'failed'
            await supabase
                .from('whatsapp_outbox')
                .update({
                    status: 'failed',
                    updated_at: new Date().toISOString(),
                    response_data: { error: sendError.message }
                })
                .eq('id', messageTask.id);
        }

    } catch (err) {
        console.error("Worker Error:", err.message);
    }
}

// --- MAIN LOOP ---
const POLL_INTERVAL = 5000;

setInterval(() => {
    processQueue();
}, POLL_INTERVAL);

console.log(`WhatsApp Gateway Worker (Twilio) started. Polling every ${POLL_INTERVAL}ms...`);

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
    res.send('WhatsApp Gateway Service is Running (Twilio Version)');
});

app.listen(PORT, () => {
    console.log(`Health Check Server running on port ${PORT}`);
});
