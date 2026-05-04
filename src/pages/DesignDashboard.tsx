import React from 'react';
import PageShell from '../components/Dashboard/PageShell';
import DashboardContent from '../components/Dashboard/DashboardContent';
import { usePageTitle } from '../hooks/usePageTitle';

const DesignDashboard: React.FC = () => {
  usePageTitle('Design Editor');
  return (
    <PageShell>
      <DashboardContent />
    </PageShell>
  );
};

export default DesignDashboard;
