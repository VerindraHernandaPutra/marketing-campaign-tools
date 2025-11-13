import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App } from './App';
import Dashboard from './pages/Dashboard';
import CampaignManager from './pages/CampaignManager';
import ScheduledPosts from './pages/ScheduledPosts';
import Analytics from './pages/Analytics';
import Projects from './pages/Projects';
import Folders from './pages/Folders';
import Templates from './pages/Templates';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor/:projectId" element={<App />} />
          <Route path="/campaign-manager" element={<CampaignManager />} />
          <Route path="/scheduled" element={<ScheduledPosts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/folders" element={<Folders />} />
          <Route path="/templates" element={<Templates />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}