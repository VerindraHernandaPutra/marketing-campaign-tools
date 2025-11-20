import React from 'react';
import { Box, NavLink, ScrollArea, Text, Divider } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, LayoutIcon, FolderIcon, ImageIcon, SendIcon, CalendarIcon, BarChartIcon, UsersIcon, LayersIcon } from 'lucide-react'; // Added icons

const DashboardSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mainLinks = [{
    icon: HomeIcon,
    label: 'Home',
    path: '/'
  }, {
    icon: LayoutIcon,
    label: 'Projects',
    path: '/projects'
  }, {
    icon: FolderIcon,
    label: 'Folders',
    path: '/folders'
  }, {
    icon: ImageIcon,
    label: 'Templates',
    path: '/templates'
  }];
  
  const crmLinks = [{ // New Section
    icon: UsersIcon,
    label: 'Clients',
    path: '/clients'
  }, {
    icon: LayersIcon,
    label: 'Groups',
    path: '/groups'
  }];

  const campaignLinks = [{
    icon: SendIcon,
    label: 'Campaign Manager',
    path: '/campaign-manager'
  }, {
    icon: CalendarIcon,
    label: 'Scheduled Posts',
    path: '/scheduled'
  }, {
    icon: BarChartIcon,
    label: 'Analytics',
    path: '/analytics'
  }];

  return <Box w={240} h="calc(100vh - 70px)" className="border-r border-gray-200 dark:border-gray-700">
      <ScrollArea h="100%">
        <Box p="md">
          <Text size="xs" fw={600} color="dimmed" mb="xs" tt="uppercase">
            Main Menu
          </Text>
          {mainLinks.map(link => <NavLink key={link.path} label={link.label} leftSection={<link.icon size={18} />} active={location.pathname === link.path} onClick={() => navigate(link.path)} className="mb-1" />)}
          
          <Divider my="md" />
          
          <Text size="xs" fw={600} color="dimmed" mb="xs" tt="uppercase">
            CRM
          </Text>
          {crmLinks.map(link => <NavLink key={link.path} label={link.label} leftSection={<link.icon size={18} />} active={location.pathname === link.path} onClick={() => navigate(link.path)} className="mb-1" />)}
          
          <Divider my="md" />
          
          <Text size="xs" fw={600} color="dimmed" mb="xs" tt="uppercase">
            Marketing
          </Text>
          {campaignLinks.map(link => <NavLink key={link.path} label={link.label} leftSection={<link.icon size={18} />} active={location.pathname === link.path} onClick={() => navigate(link.path)} className="mb-1" />)}
        </Box>
      </ScrollArea>
    </Box>;
};

export default DashboardSidebar;