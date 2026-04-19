# Project Analysis: Marketing Canva AI

This document provides a comprehensive overview of the `marketing-canva-ai` project based on my analysis of the codebase.

## 1. High-Level Architecture

The project is a Single Page Application (SPA) built to combine marketing automation with design tools (a "Canva-like" experience).

**Tech Stack:**
*   **Frontend Framework:** React 19, TypeScript, Vite
*   **Routing:** React Router DOM (v7)
*   **UI/Styling:** Mantine (v8) for core components, TailwindCSS for layout and utility styling, Lucide React for icons.
*   **Design Tool:** Fabric.js (v6) for the core canvas manipulation.
*   **State Management:** React Context (e.g., `CanvasContext`, `NotificationContext`, `UserContext`) combined with local component state.
*   **Backend/BaaS:** Supabase (Authentication, Database, Storage, Edge Functions).

## 2. Core Modules

The application is structurally divided into several key areas, accessible via the `AppRouter`:

### A. Authentication & Authorization
*   Uses Supabase Auth.
*   Implements Role-Based Access Control (RBAC) with roles like `admin`, `operator`, `designer`, and `marketer`.
*   Routes are protected by `<ProtectedRoute>` and `<RoleGuard>`.

### B. Canvas Editor (`src/components/CanvaEditor.tsx` & `src/components/LayoutNext/Canvas.tsx`)
*   Provides a rich design interface for creating marketing materials.
*   **Implementation details:**
    *   Uses `Fabric.js` for rendering and object manipulation.
    *   `CanvaEditor.tsx` acts as the orchestrator, managing the Mantine `AppShell`, sidebar, header, and properties panel.
    *   Implements a custom Undo/Redo stack by saving serialized JSON states of the canvas.
    *   Canvas state is saved to the Supabase `projects` table (`canvas_data` JSON column) along with a generated thumbnail.
    *   Supports exporting designs as PNG, JPEG, or PDF (using `jspdf`).

### C. Campaign Manager (`src/components/CampaignManager/`)
*   A complex, multi-step workflow for creating, scheduling, and distributing marketing campaigns across multiple channels.
*   **Implementation details:**
    *   Driven by a central `<CampaignForm>` using Mantine's `<Stepper>`.
    *   **Step 1 (Platforms):** Users select target platforms (Email, WhatsApp, Social Media).
    *   **Step 2 (Details):** Users input Title, Content, and Media. Integrates an AI feature (via Supabase Edge Functions) to generate or refine captions based on uploaded images and target audience context.
    *   **Step 3 (Target):** Users select target audiences. Pulls data from Supabase `groups` and `clients` tables. Renders platform-specific configuration forms (e.g., `EmailFlow`, `WhatsappFlow`).
    *   **Step 4 (Schedule):** Immediate posting or scheduling via date picker.
    *   **Execution:**
        *   Media is uploaded to Supabase Storage.
        *   Campaign metadata is saved to `marketing_campaigns`.
        *   Emails are sent via a Supabase Edge Function (`send-email`).
        *   WhatsApp messages are queued into `whatsapp_outbox`.
        *   Social posts are queued into `social_posts`.

### D. Dashboards & Analytics
*   Provides role-specific dashboards (`AdminDashboard`, `DesignDashboard`, general `Dashboard`).
*   Uses `Recharts` for data visualization and `FullCalendar` for viewing scheduled posts.

## 3. Data Flow & State Management

*   **Global State:** Heavily relies on React Context.
    *   `CanvasContext`: Shares the active Fabric.js canvas instance and the currently selected object across the editor layout (e.g., between the canvas itself and the properties panel).
    *   Auth Contexts (`useAuth`, `UserContext`): Provide current user, role, and organization ID.
*   **Data Fetching:** Direct integration with Supabase client (`supabaseClient.ts`) inside components (often within `useEffect` hooks). No dedicated data fetching library like React Query appears to be strictly enforced for all calls, though it is in `package.json`.

## 4. Observations & Potential Areas for Improvement

1.  **Direct Supabase Calls in Components:** Many components have direct database queries (e.g., `supabase.from('...').select()`) embedded within `useEffect`. As the app grows, moving these to custom hooks or a data fetching layer (like the installed React Query) could improve maintainability and caching.
2.  **Complex Form State:** The `CampaignForm` manages a very large and complex state. If this grows further, adopting a form management library (like `react-hook-form`) combined with validation (like `zod`) might simplify state updates and error handling.
3.  **Fabric.js v6:** The project is using Fabric.js version 6, which recently introduced significant API changes (e.g., modern ES modules, changes to how classes are instantiated). Any future work on the canvas needs to strictly adhere to the v6 documentation.
4.  **Testing Strategy:** The project is set up with Vitest and React Testing Library. Testing components heavily reliant on Context (like Canvas) or Supabase requires careful mocking, as noted in the memory context.

## Summary

`marketing-canva-ai` is a feature-rich, modern React application. It effectively combines a complex interactive design surface (Fabric.js) with a robust data management and workflow system (Campaign Manager), all backed by Supabase. The codebase is generally well-structured, utilizing Mantine effectively to provide a clean and consistent UI.