# Marketing Campaign Tools

A multi-tenant SaaS platform for creating and distributing marketing campaigns across WhatsApp, Facebook, Instagram, and Email — with a built-in Canva-like design editor, contact management, and real-time analytics.

---

## Demo Videos

| #      | Title                                                                | Duration |
| ------ | -------------------------------------------------------------------- | -------- |
| Part 1 | [Setup and Integration](https://www.youtube.com/watch?v=2EBOo5REB7E) | 10 min   |
| Part 2 | [Website Walkthrough](https://www.youtube.com/watch?v=1BxAkL74daA)   | 15 min   |
| Part 3 | [Analytics Results](https://www.youtube.com/watch?v=kW54c8aQ8PQ)     | 5 min    |
| Extra  | [Omnichannel Inbox](https://www.youtube.com/watch?v=0RSUA3mAnyE)     | 1 min    |

---

## Features

- **Multi-channel campaigns** — WhatsApp (Meta Cloud API + Fonnte), Facebook Messenger, Instagram, and Email (Resend)
- **Design editor** — Fabric.js-powered canvas editor for creating campaign visuals
- **Contact management** — clients, groups, and contact lists scoped per organization
- **Analytics dashboard** — delivery funnel, engagement metrics, and campaign performance tracking
- **Role-based access** — Admin, Operator, Designer, and Marketer roles per organization
- **Multi-tenant** — every resource is scoped to an organization with Supabase RLS
- **AI tools** — AI image generation and caption generation via Supabase Edge Functions
- **Social media posting** — LinkedIn, Twitter, TikTok, and more via Ayrshare

---

## Tech Stack

### Frontend

| Technology       | Version | Purpose                 |
| ---------------- | ------- | ----------------------- |
| React            | 19      | UI framework            |
| TypeScript       | 5.9     | Type safety             |
| Vite             | 7       | Build tool & dev server |
| Mantine UI       | 8       | Component library       |
| Tailwind CSS     | 3       | Utility-first styling   |
| Fabric.js        | 6.9     | Canvas design editor    |
| React Router DOM | 7.9     | Client-side routing     |
| TanStack Query   | 5       | Server state management |
| Recharts         | 3.3     | Data visualization      |
| FullCalendar     | 6.1     | Calendar scheduling     |
| Lucide React     | —       | Icon library            |

### Backend & Infrastructure

| Technology        | Purpose                                              |
| ----------------- | ---------------------------------------------------- |
| Supabase          | PostgreSQL + Auth + Realtime + Edge Functions (Deno) |
| Node.js / Express | Microservice queue workers                           |
| PM2               | Microservice process management                      |

### External Integrations

| Service        | Purpose                                                |
| -------------- | ------------------------------------------------------ |
| Meta Graph API | Facebook Pages & Instagram OAuth + Messenger API       |
| Meta Cloud API | WhatsApp message delivery                              |
| Fonnte         | WhatsApp gateway (alternative to Meta Cloud API)       |
| Resend         | Transactional email delivery                           |
| Ayrshare       | Social media posting (LinkedIn, Twitter, TikTok, etc.) |

---

## Architecture

```
Frontend (React + Vite)
    │
    ▼
Supabase (PostgreSQL + Auth + RLS + Realtime)
    │
    ├── Edge Functions (Deno)
    │       ├── send-whatsapp     → whatsapp_outbox table
    │       ├── send-email        → Resend API
    │       ├── send-social       → Ayrshare API
    │       ├── send-chat-message → messenger_outbox table
    │       ├── meta-oauth        → Meta OAuth2 token exchange
    │       ├── analytics-overview / summarize-analytics
    │       └── generate-image / generate-caption (AI)
    │
    └── Microservices (Node.js / Express — managed by PM2)
            ├── backend-wa       (port 3051) — polls whatsapp_outbox → Meta Cloud API
            ├── backend-email    — email API with Resend
            └── backend-messenger (port 3053) — polls messenger_outbox → Meta Graph API
```

**Outbox pattern:** The frontend writes to Supabase outbox tables. Microservices poll those tables and call the provider APIs, decoupling message delivery from the UI.

---

## Project Structure

```
marketing-campaign-tools/
├── src/
│   ├── AppRouter.tsx               # Route definitions with role guards
│   ├── auth/                       # AuthProvider, UserContext, useAuth hook
│   ├── components/
│   │   ├── CanvaEditor.tsx         # Fabric.js canvas editor
│   │   ├── Analytics/              # MetricsCard, CampaignPerformance, WhatsApp/EmailPerformance
│   │   ├── CampaignManager/flows/  # EmailFlow, WhatsappFlow, SocialMediaFlow
│   │   └── Dashboard/              # Layout components
│   ├── context/
│   │   ├── CanvasContext.tsx        # Fabric.js canvas state
│   │   └── NotificationContext.tsx  # Toast notifications
│   ├── pages/                      # Route-level page components
│   ├── types/supabase.ts           # Auto-generated DB types
│   └── supabaseClient.ts           # Supabase client init
├── supabase/functions/             # Deno edge functions
├── backend-wa/                     # WhatsApp queue worker
├── backend-email/                  # Email API worker
├── backend-messenger/              # Messenger queue worker
├── ecosystem.config.cjs            # PM2 process config
└── vite.config.ts
```

---

## Requirements

| Software       | Minimum Version            |
| -------------- | -------------------------- |
| Node.js        | >= 18.x                    |
| npm            | >= 9.x                     |
| PM2            | Latest (for microservices) |
| Modern browser | Chrome / Edge / Firefox    |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/username/marketing-campaign-tools.git
cd marketing-campaign-tools
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Start microservices (optional, for WhatsApp/Messenger delivery)

```bash
pm2 start ecosystem.config.cjs
```

---

## Available Scripts

| Command                          | Description                      |
| -------------------------------- | -------------------------------- |
| `npm run dev`                    | Start Vite development server    |
| `npm run build`                  | Build for production             |
| `npm run preview`                | Preview production build locally |
| `npm run lint`                   | Run ESLint                       |
| `pm2 start ecosystem.config.cjs` | Start all microservices          |
| `pm2 status`                     | Check microservice status        |
| `pm2 logs`                       | View microservice logs           |

---

## Role System

| Role         | Access                                                    |
| ------------ | --------------------------------------------------------- |
| **Admin**    | Full access — org settings, user management, all features |
| **Operator** | Campaign management, contacts, analytics                  |
| **Designer** | Design editor, template library                           |
| **Marketer** | Campaign creation, analytics (read-only)                  |

Super Admins can manage multiple organizations from the Admin Dashboard.

---

## Database

The platform uses Supabase (PostgreSQL) with Row Level Security (RLS). Key tables:

- `organizations` + `organization_members` — multi-tenant org and role assignments
- `organization_integrations` — OAuth tokens per org (Meta, Fonnte, Resend, Ayrshare)
- `marketing_campaigns` — campaign metadata and configuration
- `whatsapp_outbox` + `messenger_outbox` — message delivery queues
- `social_posts` — social media post queue
- `email_events` — email tracking (opens, clicks, bounces)
- `clients`, `groups`, `contacts` — contact management
- `projects` — Fabric.js canvas JSON storage
