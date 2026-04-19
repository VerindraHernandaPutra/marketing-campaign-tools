import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3052;

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const META_GRAPH_VERSION = 'v19.0';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("FATAL: Missing Configuration (SUPABASE)");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getIntegration(organizationId, platform) {
    const { data, error } = await supabase
        .from('organization_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('platform', platform)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function postFacebookPage(pageId, accessToken, content, mediaUrls = []) {
    const firstMedia = mediaUrls[0];
    if (firstMedia) {
        const response = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                url: firstMedia,
                caption: content,
                published: 'true',
                access_token: accessToken,
            }),
        });
        return await response.json();
    }

    const response = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            message: content,
            access_token: accessToken,
        }),
    });
    return await response.json();
}

function isVideoUrl(url) {
    const normalized = String(url || '').toLowerCase();
    return ['.mp4', '.mov', '.m4v', '.webm'].some((ext) => normalized.includes(ext));
}

async function waitForInstagramContainerReady(containerId, accessToken) {
    const maxAttempts = 12;
    const delayMs = 2500;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const response = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`);
        const payload = await response.json();

        if (!response.ok || payload?.error) {
            throw new Error(payload?.error?.message || 'Failed checking Instagram media status');
        }

        const statusCode = String(payload?.status_code || payload?.status || '').toUpperCase();
        if (statusCode === 'FINISHED') return;
        if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
            throw new Error(`Instagram container failed with status: ${statusCode}`);
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error('Instagram media processing timeout. Please retry.');
}

async function postInstagramBusiness(igUserId, accessToken, content, mediaUrls = []) {
    const firstMedia = mediaUrls[0];
    if (!firstMedia) throw new Error('Instagram requires at least one public image/video URL');

    const createBody = new URLSearchParams({
        caption: content,
        access_token: accessToken,
    });

    if (isVideoUrl(firstMedia)) {
        createBody.set('video_url', firstMedia);
        createBody.set('media_type', 'VIDEO');
    } else {
        createBody.set('image_url', firstMedia);
    }

    const createResponse = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: createBody,
    });

    const createResult = await createResponse.json();
    if (!createResponse.ok || createResult.error) {
        throw new Error(createResult.error?.message || 'Failed to create Instagram container');
    }

    await waitForInstagramContainerReady(createResult.id, accessToken);

    const publishResponse = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            creation_id: createResult.id,
            access_token: accessToken,
        }),
    });

    const publishResult = await publishResponse.json();
    if (!publishResponse.ok || publishResult.error) {
        throw new Error(publishResult.error?.message || 'Failed to publish Instagram post');
    }

    return { container: createResult, published: publishResult };
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
            const results = {};
            const errors = [];

            for (const platform of (postTask.platforms || [])) {
                try {
                    if (platform === 'facebook') {
                        const integration = await getIntegration(postTask.organization_id, 'facebook_page');
                        if (!integration) throw new Error('Facebook Page integration not connected');
                        results.facebook = await postFacebookPage(integration.provider_account_id, integration.access_token, postTask.content, postTask.media_urls || []);
                    } else if (platform === 'instagram') {
                        const integration = await getIntegration(postTask.organization_id, 'instagram_business');
                        if (!integration) throw new Error('Instagram Business integration not connected');
                        results.instagram = await postInstagramBusiness(integration.provider_account_id, integration.access_token, postTask.content, postTask.media_urls || []);
                    } else {
                        errors.push(`${platform}: unsupported platform in Meta-native worker`);
                    }
                } catch (err) {
                    const message = String(err?.message || 'Unknown error');
                    if (platform === 'instagram' && message.includes('instagram_content_publish')) {
                        errors.push(`${platform}: Missing instagram_content_publish permission. Reconnect Instagram integration and grant publish permission.`);
                    } else {
                        errors.push(`${platform}: ${message}`);
                    }
                }
            }

            // 2. Update Status to 'sent' if any platform succeeded, otherwise 'failed'
            await supabase
                .from('social_posts')
                .update({
                    status: Object.keys(results).length > 0 ? (errors.length > 0 ? 'partial_failed' : 'sent') : 'failed',
                    updated_at: new Date().toISOString(),
                    response_data: { results, errors }
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

console.log(`Social Media Worker (Meta-native) started. Polling every ${POLL_INTERVAL}ms...`);

// --- HEALTH CHECK (Required for Render Free Tier) ---
app.get('/', (req, res) => {
    res.send('Social Worker Service is Running (Meta-native Version)');
});

app.listen(PORT, () => {
    console.log(`Health Check Server running on port ${PORT}`);
});
