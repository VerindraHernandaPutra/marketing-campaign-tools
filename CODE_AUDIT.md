# Project Code Audit Report

This document outlines the findings from a comprehensive audit of the `marketing-canva-ai` codebase. The audit includes automated checks (TypeScript compilation, ESLint) and manual architectural/security reviews.

## 1. Type & Syntax Errors (TypeScript Compiler)

The `tsc --noEmit` command revealed several type and syntax errors that need to be addressed to ensure runtime stability and type safety.

*   **`src/components/Dashboard/DesignCard.tsx` (Line 308):**
    *   *Error:* `Property 'is_template' does not exist on type '{ id: string; title: string; ... }'`.
    *   *Fix:* Update the interface/type defining the `design` prop to include `is_template?: boolean`.
*   **`src/components/ScheduledPosts/ScheduledList.tsx` (Line 304):**
    *   *Error:* Passing `radius="lg"` to the Mantine `<Table>` component. Mantine's Table does not natively support the `radius` prop on the root element in this version.
    *   *Fix:* Remove the `radius` prop or wrap the table in a `<Paper radius="lg">` or `<Box style={{ borderRadius: ... }}>`.
*   **`src/components/Layout/Canvas.tsx` (Line 92):**
    *   *Error:* `Property 'isDisposed' does not exist on type 'Canvas'`.
    *   *Fix:* In Fabric.js v6, the property might have been renamed or removed. Check if `canvas.disposed` is the correct property, or simply rely on clearing the wrapper element if the instance is being destroyed.
*   **`src/components/Dashboard/DashboardContent.tsx` (Line 563):**
    *   *Error:* Missing required property `data` in `<EngagementChart />`.
    *   *Fix:* Ensure the `data` prop is passed to the component.
*   **`src/components/CanvaEditor.tsx` (Line 334):**
    *   *Error:* Type '""' is not assignable to type '"alt" | "default" | undefined' (likely on an `<AppShell>` or similar Mantine layout prop).
    *   *Fix:* Remove the empty string assignment or replace it with a valid enum string.
*   **`src/pages/AdminDashboard.tsx` (Line 101):**
    *   *Error:* Trying to access `name` on an array type.
    *   *Fix:* Check array mapping or access the first element `arr[0].name`.
*   **Multiple Unused Imports:**
    *   Many files have imported React or Mantine components that are declared but never used (e.g., `Flex` in `Campaigns.tsx`, `React` in `IntegrationsInstagram.tsx`, `Stack` in `CampaignPerformance.tsx`).

## 2. Linting Issues (ESLint)

Running `eslint .` highlighted issues related to best practices, particularly regarding React Hooks and TypeScript strictness.

*   **Missing Dependencies in `useEffect`:**
    *   `src/components/CampaignManager/CampaignForm.tsx` (Line 82): Missing `user` dependency.
    *   `src/pages/Inbox.tsx` (Lines 65, 85): Missing `fetchConversations` and `fetchMessages` dependencies.
    *   `src/pages/IntegrationsInstagram.tsx` (Line 24): Missing `fetchIntegrations`.
    *   *Risk:* This can lead to stale closures where the hook executes with old state/props, causing subtle bugs.
    *   *Fix:* Include the functions/variables in the dependency array. If they are functions, wrap them in `useCallback`.
*   **Usage of `any` (`@typescript-eslint/no-explicit-any`):**
    *   The project enforces a strict no-any rule, but it is violated in 23 places across the codebase (e.g., `CampaignForm.tsx`, Edge Functions, `WhatsappFlow.tsx`).
    *   *Fix:* Define proper TypeScript interfaces or use `unknown` if the type cannot be determined at compile time.
*   **Variable Reassignment (`prefer-const`):**
    *   `supabase/functions/analytics-overview/index.ts` (Line 437): `totals` is never reassigned. Use `const` instead of `let`.

## 3. Architectural & Performance Review

*   **Direct Database Access in Components:**
    *   *Finding:* Currently, data fetching (e.g., `supabase.from('...').select()`) is performed directly inside component `useEffect` hooks across many pages (`CampaignForm`, `CanvaEditor`, `DashboardContent`).
    *   *Problem:* This tightly couples UI components to database schema, makes testing difficult (requires heavy mocking), and lacks built-in caching or deduplication.
    *   *Recommendation:* Since `@tanstack/react-query` is installed in `package.json`, move all data fetching logic into custom hooks (e.g., `useProject(projectId)`, `useCampaigns()`). This will drastically improve performance, handle loading/error states cleanly, and reduce redundant network requests.
*   **Large Component Files:**
    *   *Finding:* Files like `CampaignForm.tsx` manage complex multi-step state, API calls, file handling, and UI rendering in a single file.
    *   *Recommendation:* Break down large forms. Use context or a form state management library to handle data across steps, and separate the API submission logic into a dedicated service layer.

## 4. Security & Edge Functions Review

*   **Supabase RLS (Row Level Security):**
    *   *Observation:* Based on queries like `.eq('user_id', user.id)` or `.eq('organization_id', currentOrgId)`, it appears the app attempts to filter data on the frontend.
    *   *Recommendation:* Ensure that Supabase Row Level Security (RLS) policies are properly configured on the backend for tables like `projects`, `marketing_campaigns`, and `clients`. Frontend filtering is not a security measure. If an attacker uses the anon key directly, RLS is the only thing preventing them from reading all data.
*   **Edge Function Error Handling:**
    *   *Finding:* In `CampaignForm.tsx`, when invoking edge functions (like `generate-caption` or `send-email`), the error catching handles the `invokeError` but doesn't always rigorously check for HTTP errors returned within `resultData` if the function throws an internal exception but returns a 200 OK wrapper.
    *   *Recommendation:* Ensure all edge functions return standardized `{ data, error }` objects and that the frontend checks both the network transport error and the application-level error.

## Summary

The application functions well but requires a cleanup pass to fix TypeScript compilation errors and linting warnings, specifically regarding React Hook dependencies and the overuse of `any`. Architecturally, migrating the direct Supabase calls into React Query hooks will be the highest impact improvement for codebase maintainability and application performance.