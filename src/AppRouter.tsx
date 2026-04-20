import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { RoleGuard } from './components/Auth/RoleGuard';

// Lazy-loaded pages — each becomes its own JS chunk
const Dashboard            = lazy(() => import('./pages/Dashboard'));
const LoginPage            = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const Profile              = lazy(() => import('./pages/Profile'));
const AdminDashboard       = lazy(() => import('./pages/AdminDashboard'));
const OrganizationDetails  = lazy(() => import('./pages/OrganizationDetails'));
const Groups               = lazy(() => import('./pages/Groups'));
const Clients              = lazy(() => import('./pages/Clients'));
const DesignDashboard      = lazy(() => import('./pages/DesignDashboard'));
const Projects             = lazy(() => import('./pages/Projects'));
const App                  = lazy(() => import('./App').then(m => ({ default: m.App })));
const Templates            = lazy(() => import('./pages/Templates'));
const Folders              = lazy(() => import('./pages/Folders'));
const Inbox                = lazy(() => import('./pages/Inbox'));
const CampaignCreate       = lazy(() => import('./pages/CampaignCreate'));
const ScheduledPosts       = lazy(() => import('./pages/ScheduledPosts'));
const Analytics            = lazy(() => import('./pages/Analytics'));
const WhatsAppTest         = lazy(() => import('./pages/WhatsAppTest'));
const WhatsAppTemplates    = lazy(() => import('./pages/WhatsAppTemplates'));
const Campaigns            = lazy(() => import('./pages/Campaigns'));
const IntegrationsWhatsApp = lazy(() => import('./pages/IntegrationsWhatsApp'));
const IntegrationsInstagram= lazy(() => import('./pages/IntegrationsInstagram'));
const IntegrationsMessenger= lazy(() => import('./pages/IntegrationsMessenger'));
const IntegrationsResend   = lazy(() => import('./pages/IntegrationsResend'));
const MetaOAuthCallback    = lazy(() => import('./pages/MetaOAuthCallback'));

const PageLoader = () => (
  <Center h="100vh">
    <Loader size="sm" color="blue" />
  </Center>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/integrations/meta-callback" element={<MetaOAuthCallback />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/integrations/whatsapp" element={<IntegrationsWhatsApp />} />
            <Route path="/integrations/instagram" element={<IntegrationsInstagram />} />
            <Route path="/integrations/messenger" element={<IntegrationsMessenger />} />
            <Route path="/integrations/resend" element={<IntegrationsResend />} />
            <Route path="/integrations" element={<Navigate to="/integrations/messenger" replace />} />

            {/* SUPER ADMIN */}
            <Route element={<RoleGuard allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/organization/:orgId" element={<OrganizationDetails />} />
            </Route>

            {/* OPERATOR */}
            <Route element={<RoleGuard allowedRoles={['operator']} />}>
              <Route path="/groups" element={<Groups />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/organization/users" element={<OrganizationDetails />} />
            </Route>

            {/* DESIGNER & OPERATOR */}
            <Route element={<RoleGuard allowedRoles={['designer', 'operator']} />}>
              <Route path="/design-dashboard" element={<DesignDashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/editor/:projectId" element={<App />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/folders" element={<Folders />} />
            </Route>

            {/* MARKETER & OPERATOR */}
            <Route element={<RoleGuard allowedRoles={['marketer', 'operator']} />}>
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/campaign-manager" element={<ScheduledPosts />} />
              <Route path="/campaign-manager/new" element={<CampaignCreate />} />
              <Route path="/campaign-manager/edit/:campaignId" element={<CampaignCreate />} />
              <Route path="/scheduled" element={<Navigate to="/campaign-manager" replace />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/wa-test" element={<WhatsAppTest />} />
              <Route path="/wa-templates" element={<WhatsAppTemplates />} />
            </Route>

            {/* DESIGNER, MARKETER & OPERATOR */}
            <Route element={<RoleGuard allowedRoles={['designer', 'marketer', 'operator']} />}>
              <Route path="/campaigns" element={<Campaigns />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
