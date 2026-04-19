import express from 'express';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Attempt to load .env from parent directory if needed
dotenv.config({ path: path.resolve(__dirname, '../backend-social/.env') });

const app = express();
const PORT = process.env.MESSENGER_PORT || 3053;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("FATAL: Missing Configuration (SUPABASE_URL or SUPABASE_SERVICE_KEY)");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- META GRAPH API SENDER ---
async function sendMessengerDM(psid, messageText, pageId, pageAccessToken) {
    // Standard Messenger Send API documentation:
    // https://developers.facebook.com/docs/messenger-platform/reference/send-api

    const payload = {
        recipient: { id: psid },
        message: { text: messageText },
        messaging_type: "MESSAGE_TAG", // Using Message_Tag to attempt delivery outside 24h window
        tag: "ACCOUNT_UPDATE" // A generic tag that might pass depending on content
    };

    try {
        const response = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/messages`, payload, {
            params: { access_token: pageAccessToken },
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error("Meta Graph API Error:", JSON.stringify(error.response.data, null, 2));
            throw new Error(error.response.data.error?.message || "Meta API Failed");
        }
        throw error;
    }
}

// --- WORKER LOOP ---
async function processQueue() {
    try {
        // 1. Fetch pending messages
        const { data: messages, error } = await supabase
            .from('messenger_outbox')
            .select('*')
            .eq('status', 'scheduling')
            .limit(5);

        if (error) throw error;
        if (!messages || messages.length === 0) return;

        console.log(`Processing ${messages.length} messenger tasks...`);

        // Group by organization to minimize Auth token lookups
        const orgsCache = {};

        for (const messageTask of messages) {
            try {
                // 2. Look up the organization's Messenger credentials
                let orgConfig = orgsCache[messageTask.organization_id];
                if (!orgConfig) {
                    const { data: configData, error: configError } = await supabase
                        .from('organization_integrations')
                        .select('*')
                        .eq('organization_id', messageTask.organization_id)
                        .eq('platform', 'messenger')
                        .limit(1)
                        .single();

                    if (configError || !configData) {
                        throw new Error(`Integration missing for organization ${messageTask.organization_id}`);
                    }
                    orgsCache[messageTask.organization_id] = configData;
                    orgConfig = configData;
                }

                const pageId = orgConfig.provider_account_id;
                const accessToken = orgConfig.access_token;

                // 3. Send the message via Meta
                const result = await sendMessengerDM(messageTask.psid, messageTask.message, pageId, accessToken);

                // 4. Update Status to 'sent'
                await supabase
                    .from('messenger_outbox')
                    .update({
                        status: 'sent',
                        updated_at: new Date().toISOString(),
                        response_data: result
                    })
                    .eq('id', messageTask.id);

                console.log(`[Success] Sent to PSID: ${messageTask.psid}`);

            } catch (sendError) {
                console.error(`[Failed] Task ID: ${messageTask.id} | ${sendError.message}`);
                // 3. Update Status to 'failed'
                await supabase
                    .from('messenger_outbox')
                    .update({
                        status: 'failed',
                        updated_at: new Date().toISOString(),
                        response_data: { error: sendError.message }
                    })
                    .eq('id', messageTask.id);
            }
        }

    } catch (err) {
        console.error("Worker Global Error:", err.message);
    }
}

// --- MAIN LOOP ---
const POLL_INTERVAL = 5000; // 5 seconds polling

setInterval(() => {
    processQueue();
}, POLL_INTERVAL);

console.log(`Facebook Messenger Worker (Graph API) started. Polling every ${POLL_INTERVAL}ms...`);

app.get('/', (req, res) => {
    res.send('Messenger Worker Service is Running');
});

app.listen(PORT, () => {
    console.log(`Health Check Server running on port ${PORT}`);
});
