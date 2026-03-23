import express from 'express';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3052;

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !AYRSHARE_API_KEY) {
    console.error("FATAL: Missing Configuration (SUPABASE or AYRSHARE)");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- AYRSHARE API ---
async function postToSocials(content, platforms, mediaUrls) {
    // Ayrshare /post endpoint
    // https://docs.ayrshare.com/rest-api/endpoints/post

    const payload = {
        post: content,
        platforms: platforms, // e.g. ["facebook", "instagram"]
        mediaUrls: mediaUrls || []
    };

    console.log("Sending to Ayrshare:", JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post('https://app.ayrshare.com/api/post', payload, {
            headers: {
                'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error("Ayrshare API Error:", JSON.stringify(error.response.data, null, 2));
            throw new Error(error.response.data.message || "Ayrshare Failed");
        }
        throw error;
    }
}

// --- WORKER LOOP ---
async function processQueue() {
    try {
        // 1. Fetch pening posts
        const { data: posts, error } = await supabase
            .from('social_posts')
            .select('*')
            .eq('status', 'scheduling')
            .limit(1);

        if (error) throw error;
        if (!posts || posts.length === 0) return;

        const postTask = posts[0];
        console.log(`[Processing] ID: ${postTask.id}, Platforms: ${postTask.platforms}`);

        try {
            const result = await postToSocials(postTask.content, postTask.platforms, postTask.media_urls);

            // 2. Update Status to 'sent'
            await supabase
                .from('social_posts')
                .update({
                    status: 'sent',
                    updated_at: new Date().toISOString(),
                    ayrshare_id: result.id, // Ayrshare returns a main 'id' and 'postIds' per platform
                    response_data: result
                })
                .eq('id', postTask.id);

            console.log(`[Success] Posted ID: ${postTask.id}`);

        } catch (sendError) {
            console.error(`[Failed] ID: ${postTask.id}`, sendError.message);
            // 3. Update Status to 'failed'
            await supabase
                .from('social_posts')
                .update({
                    status: 'failed',
                    updated_at: new Date().toISOString(),
                    response_data: { error: sendError.message }
                })
                .eq('id', postTask.id);
        }

    } catch (err) {
        console.error("Worker Error:", err.message);
    }
}

// --- MAIN LOOP ---
const POLL_INTERVAL = 10000; // 10 seconds (Social is less urgent)

setInterval(() => {
    processQueue();
}, POLL_INTERVAL);

console.log(`Social Media Worker (Ayrshare) started. Polling every ${POLL_INTERVAL}ms...`);

// --- HEALTH CHECK (Required for Render Free Tier) ---
app.get('/', (req, res) => {
    res.send('Social Worker Service is Running (Ayrshare Version)');
});

app.listen(PORT, () => {
    console.log(`Health Check Server running on port ${PORT}`);
});
