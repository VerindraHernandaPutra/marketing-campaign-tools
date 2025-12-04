import React from 'react';
import { Box, NavLink, ScrollArea, Text, Divider, Loader, Center } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, LayoutIcon, ImageIcon, SendIcon, CalendarIcon, BarChartIcon, UsersIcon, LayersIcon, ShieldIcon } from 'lucide-react';
import { useUserRole } from '../../auth/UserContext';

const DashboardSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, isSuperAdmin, loadingRole } = useUserRole();

  if (loadingRole) {
    return (
        <Box w={240} h="calc(100vh - 70px)" className="border-r border-gray-200 dark:border-gray-700" p="xl">
            <Center h="100%">
                <Loader size="sm" variant="dots" />
            </Center>
        </Box>
    );
  }

  // --- SUPER ADMIN VIEW ---
  // Exclusive view: Hides all other menus as requested
  if (isSuperAdmin) {
    return (
      <Box w={240} h="calc(100vh - 70px)" className="border-r border-gray-200 dark:border-gray-700">
        <ScrollArea h="100%">
          <Box p="md">
            <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase">
              Administration
            </Text>
            <NavLink 
              label="Super Admin" 
              leftSection={<ShieldIcon size={18} />} 
              active={location.pathname.startsWith('/admin')} 
              onClick={() => navigate('/admin')} 
              color="red"
              variant="filled"
              className="mb-1"
            />
          </Box>
        </ScrollArea>
      </Box>
    );
  }

  // --- STANDARD ROLE LOGIC ---
  const canAccessDesign = role === 'operator' || role === 'designer';
  const canAccessMarketing = role === 'operator' || role === 'marketer';
  const canAccessCRM = role === 'operator';

  return (
    <Box w={240} h="calc(100vh - 70px)" className="border-r border-gray-200 dark:border-gray-700">
      <ScrollArea h="100%">
        <Box p="md">
          <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase">
            Main Menu
          </Text>
          <NavLink 
            label="Home" 
            leftSection={<HomeIcon size={18} />} 
            active={location.pathname === '/'} 
            onClick={() => navigate('/')} 
            className="mb-1" 
          />
          
          {/* DESIGN FEATURES */}
          {canAccessDesign && (
            <>
              <NavLink 
                label="Projects" 
                leftSection={<LayoutIcon size={18} />} 
                active={location.pathname === '/projects'} 
                onClick={() => navigate('/projects')} 
                className="mb-1" 
              />
              <NavLink 
                label="Templates" 
                leftSection={<ImageIcon size={18} />} 
                active={location.pathname === '/templates'} 
                onClick={() => navigate('/templates')} 
                className="mb-1" 
              />
            </>
          )}
          
          {/* CRM FEATURES */}
          {canAccessCRM && (
            <>
              <Divider my="md" />
              <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase">
                Organization
              </Text>
              <NavLink 
                label="Clients" 
                leftSection={<UsersIcon size={18} />} 
                active={location.pathname === '/clients'} 
                onClick={() => navigate('/clients')} 
                className="mb-1" 
              />
              <NavLink 
                label="Groups" 
                leftSection={<LayersIcon size={18} />} 
                active={location.pathname === '/groups'} 
                onClick={() => navigate('/groups')} 
                className="mb-1" 
              />
              <NavLink 
                label="Users" 
                leftSection={<UsersIcon size={18} />} 
                active={location.pathname === '/organization/users'} 
                onClick={() => navigate('/organization/users')} 
                className="mb-1" 
              />
            </>
          )}
          
          {/* MARKETING FEATURES */}
          {canAccessMarketing && (
            <>
              <Divider my="md" />
              <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase">
                Marketing
              </Text>
              <NavLink 
                label="Campaign Manager" 
                leftSection={<SendIcon size={18} />} 
                active={location.pathname.startsWith('/campaign-manager')} 
                onClick={() => navigate('/campaign-manager')} 
                className="mb-1" 
              />
              <NavLink 
                label="Scheduled Posts" 
                leftSection={<CalendarIcon size={18} />} 
                active={location.pathname === '/scheduled'} 
                onClick={() => navigate('/scheduled')} 
                className="mb-1" 
              />
              <NavLink 
                label="Analytics" 
                leftSection={<BarChartIcon size={18} />} 
                active={location.pathname === '/analytics'} 
                onClick={() => navigate('/analytics')} 
                className="mb-1" 
              />
            </>
          )}
        </Box>
      </ScrollArea>
    </Box>
  );
};

export default DashboardSidebar;