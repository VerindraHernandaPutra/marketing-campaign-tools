// [cite: src/AppRouter.tsx]
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App } from './App';
import Dashboard from './pages/Dashboard';
import CampaignManager from './pages/CampaignManager';
import CampaignCreate from './pages/CampaignCreate';
import ScheduledPosts from './pages/ScheduledPosts';
import WhatsAppTest from './pages/WhatsAppTest';
import Analytics from './pages/Analytics';
import Projects from './pages/Projects';
import Folders from './pages/Folders';
import Templates from './pages/Templates';
import Campaigns from './pages/Campaigns';
import DesignDashboard from './pages/DesignDashboard';
import Clients from './pages/Clients';
import Groups from './pages/Groups';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import OrganizationDetails from './pages/OrganizationDetails';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { RoleGuard } from './components/Auth/RoleGuard';
import IntegrationsWhatsApp from './pages/IntegrationsWhatsApp';
import IntegrationsInstagram from './pages/IntegrationsInstagram';
import IntegrationsMessenger from './pages/IntegrationsMessenger';
import IntegrationsResend from './pages/IntegrationsResend';
import Inbox from './pages/Inbox';
import WhatsAppTemplates from './pages/WhatsAppTemplates';
import MetaOAuthCallback from './pages/MetaOAuthCallback';

export function AppRouter() {
  return (
    <BrowserRouter>
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
            {/* Admin drill-down view */}
            <Route path="/admin/organization/:orgId" element={<OrganizationDetails />} />
          </Route>

          {/* OPERATOR - Organization Management */}
          <Route element={<RoleGuard allowedRoles={['operator']} />}>
            <Route path="/groups" element={<Groups />} />
            <Route path="/clients" element={<Clients />} />
            {/* Operator managing their own org users */}
            <Route path="/organization/users" element={<OrganizationDetails />} />
            {/* Operator can see the specific Campaigns Design Page */}
            <Route path="/campaigns" element={<Campaigns />} />
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
            <Route path="/campaign-manager" element={<CampaignManager />} />
            <Route path="/campaign-manager/new" element={<CampaignCreate />} />
            <Route path="/campaign-manager/edit/:campaignId" element={<CampaignCreate />} />
            <Route path="/scheduled" element={<ScheduledPosts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/wa-test" element={<WhatsAppTest />} />
            <Route path="/wa-templates" element={<WhatsAppTemplates />} />
            {/* Marketers can also view campaign designs */}
            <Route path="/campaigns" element={<Campaigns />} />
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}