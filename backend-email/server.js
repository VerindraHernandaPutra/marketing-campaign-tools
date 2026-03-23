import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3050;

// Initialize Supabase Client for Backend
// YOU NEED TO ADD SUPABASE_URL and SUPABASE_SERVICE_KEY to your .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use Service Key to bypass RLS for writing
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

app.use(cors({ origin: '*', methods: ['POST', 'GET', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '10mb' }));

// --- SEND EMAIL ENDPOINT ---
app.post('/api/send-email', async (req, res) => {
    try {
        const { to, subject, html, scheduledAt, attachments, tags } = req.body;
        console.log(`Sending to: ${to}`);
        const resendApiKey = process.env.RESEND_API_KEY;
        
        if (!resendApiKey) return res.status(500).json({ error: 'Missing API Key' });

        const payload = {
            from: 'Marketing Team <info@marketing.gloaicloud.com>',
            to: [to],
            subject: subject,
            html: html,
            reply_to: 'marketing@gloaicloud.com',
            tags: tags || [], // Pass tags from frontend to track campaign_id
            headers: {
                'X-Entity-Ref-ID': Date.now().toString(),
            }
        };

        if (scheduledAt) payload.scheduled_at = scheduledAt;
        if (attachments?.length) {
            payload.attachments = attachments.map((att) => ({
                filename: att.filename.replace(/[^a-zA-Z0-9.-]/g, '_'),
                content: att.content,
                content_id: att.content_id,
                disposition: 'inline',
            }));
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        
        // Log the "Sent" event to Supabase manually as a backup
        if (response.ok && supabase) {
            await supabase.from('email_events').insert({
                email_id: data.id,
                type: 'sent',
                recipient: to,
                created_at: new Date().toISOString()
            });
        }

        if (!response.ok) throw new Error(data.message || 'Failed to send');
        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});

// --- ANALYTICS ENDPOINT ---
app.get('/api/email-stats', async (req, res) => {
    try {
        const resendApiKey = process.env.RESEND_API_KEY;
        const response = await fetch('https://api.resend.com/emails', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${resendApiKey}` },
        });
        const result = await response.json();
        const emails = result.data || [];

        const stats = {
            total: emails.length,
            delivered: emails.filter(e => ['delivered', 'opened', 'clicked'].includes(e.last_event)).length,
            bounced: emails.filter(e => e.last_event === 'bounced').length,
            opened: emails.filter(e => ['opened', 'clicked'].includes(e.last_event)).length,
            clicked: emails.filter(e => e.last_event === 'clicked').length,
            recent_emails: emails.slice(0, 10)
        };
        return res.status(200).json(stats);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// --- WEBHOOK ENDPOINT (For Real-time Tracking) ---
// You must add this URL (https://marketing.gloaicloud.com:3050/api/webhooks/resend) to Resend Dashboard
app.post('/api/webhooks/resend', async (req, res) => {
    const event = req.body;
    
    // Example event: { type: 'email.clicked', data: { email_id: '...', to: ['...'], click: { link: '...' } } }
    console.log("Webhook Received:", event.type);

    if (supabase) {
        try {
            const insertData = {
                email_id: event.data.email_id,
                type: event.type.replace('email.', ''), // 'clicked', 'opened'
                recipient: event.data.to ? event.data.to[0] : 'unknown',
                created_at: event.created_at || new Date().toISOString()
            };

            // If it's a click, save the link
            if (event.data.click) {
                insertData.link_url = event.data.click.link;
            }

            const { error } = await supabase.from('email_events').insert(insertData);
            if (error) console.error("Supabase Insert Error:", error);
            
        } catch (err) {
            console.error("Webhook Processing Error:", err);
        }
    }

    res.status(200).send('Webhook received');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));