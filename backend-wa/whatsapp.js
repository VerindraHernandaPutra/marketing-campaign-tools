import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = 3051;

app.use(cors());

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("FATAL: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- META CLOUD API SENDER ---
async function sendWhatsAppMessage(to, body, phoneId, accessToken, mediaUrls, metadata) {
    const cleanNumber = to.replace(/[^\d]/g, '');

    // For Meta, we typically need to send templates to initiate a conversation outside a 24-hour window.
    // If the message is exactly 'hello_world', we format it as an official template payload.
    // Otherwise, we attempt to send it as standard text (which may fail if no active conversation window exists).
    
    let messagePayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanNumber
    };
    if (metadata && metadata.template_name) {
        messagePayload.type = 'template';
        messagePayload.template = {
            name: metadata.template_name,
            language: { code: metadata.template_language || 'en_US' }
        };
        
        // If content is provided, attempt to inject dynamic text parameters:
        if (body && body.trim() !== '' && body !== 'hello_world') {
            const params = [];
            const pCount = metadata.param_count || 1;
            
            if (pCount >= 2) {
                 params.push({ type: "text", text: metadata.org_name || 'Your Organization' });
                 params.push({ type: "text", text: body });
            } else {
                 params.push({ type: "text", text: body });
            }

            messagePayload.template.components = [
                {
                    type: "body",
                    parameters: params
                }
            ];
        }
    } else if (body === 'hello_world') {
        messagePayload.type = 'template';
        messagePayload.template = {
            name: 'hello_world',
            language: { code: 'en_US' }
        };
    } else {
        messagePayload.type = 'text';
        messagePayload.text = { body: body };
        
        // Note: Graph API ignores media here in this generic block if we aren't using the media payload format.
        // But for testing purposes, we support basic text and the hello_world template.
    }

    try {
        const response = await axios.post(`https://graph.facebook.com/v19.0/${phoneId}/messages`, messagePayload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        if (data.error) {
            throw new Error(data.error.message);
        }

        return data; // contains messages array with message IDs
    } catch (error) {
        let errorMsg = error.message;
        if (error.response && error.response.data) {
            errorMsg = JSON.stringify(error.response.data.error || error.response.data);
        }
        console.error("Meta Graph API Error:", errorMsg);
        throw new Error(errorMsg);
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
        console.log(`[Processing] ID: ${messageTask.id}, Phone: ${messageTask.phone}, Org: ${messageTask.organization_id}`);

        if (!messageTask.organization_id) {
             console.error(`[Failed] Message Task ${messageTask.id} is missing an organization_id.`);
             await supabase.from('whatsapp_outbox').update({ status: 'failed', response_data: { error: "Missing organization_id" } }).eq('id', messageTask.id);
             return;
        }

        try {
            // 2. Look up the organization's WhatsApp credentials
            const { data: orgConfig, error: configError } = await supabase
                .from('organization_integrations')
                .select('*')
                .eq('organization_id', messageTask.organization_id)
                .eq('platform', 'whatsapp')
                .limit(1)
                .single();

            if (configError || !orgConfig) {
                throw new Error("No configured WhatsApp Integration found for this organization.");
            }

            const phoneId = orgConfig.provider_account_id;
            const accessToken = orgConfig.access_token;

            const { data: orgData } = await supabase.from('organizations').select('name').eq('id', messageTask.organization_id).single();
            const orgName = orgData ? orgData.name : 'Your Organization';

            // 3. Send the message via Meta
            const content = messageTask.message || "hello_world";
            const result = await sendWhatsAppMessage(messageTask.phone, content, phoneId, accessToken, messageTask.media_urls, { ...(messageTask.metadata || {}), org_name: orgName });

            // 4. Update Status to 'sent'
            await supabase
                .from('whatsapp_outbox')
                .update({
                    status: 'sent',
                    updated_at: new Date().toISOString(),
                    response_data: result
                })
                .eq('id', messageTask.id);

            const msgId = result.messages && result.messages[0] ? result.messages[0].id : 'unknown';
            console.log(`[Success] Message sent to ${messageTask.phone} (Meta Msg ID: ${msgId})`);

        } catch (sendError) {
            console.error(`[Failed] Could not send to ${messageTask.phone}:`, sendError.message);
            // Update Status to 'failed'
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

console.log(`WhatsApp Gateway Worker (Meta Cloud Multi-Tenant) started. Polling every ${POLL_INTERVAL}ms...`);

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
    res.send('WhatsApp Gateway Service is Running (Meta Cloud API Version)');
});

app.listen(PORT, () => {
    console.log(`Health Check Server running on port ${PORT}`);
});
