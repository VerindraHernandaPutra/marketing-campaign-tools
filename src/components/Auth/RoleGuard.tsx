import React from 'react';
import { Outlet } from 'react-router-dom';
import { useUserRole, UserRole } from '../../auth/UserContext';
import { Loader, Center, Text, Stack, Button } from '@mantine/core';
import { ShieldAlertIcon } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
  const { role, loadingRole, isSuperAdmin } = useUserRole();

  if (loadingRole) {
    return <Center h="100vh"><Loader /></Center>;
  }

  // Super Admin bypasses everything
  if (isSuperAdmin) {
    return <Outlet />;
  }

  // Check if user has one of the allowed roles
  if (role && allowedRoles.includes(role)) {
    return <Outlet />;
  }

  // Access Denied View
  return (
    <Center h="100vh">
      <Stack align="center" gap="md">
        <ShieldAlertIcon size={64} className="text-red-500" />
        <Text size="xl" fw={700} c="red">Access Denied</Text>
        <Text c="dimmed">You do not have permission to view this page.</Text>
        <Text size="sm" c="dimmed" bg="gray.1" p="xs" style={{ borderRadius: 8 }}>
          Your Role: <b>{role || 'None'}</b> <br/>
          Required: {allowedRoles.join(', ')}
        </Text>
        <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
      </Stack>
    </Center>
  );
};