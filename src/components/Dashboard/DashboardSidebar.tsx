// [cite: src/components/Dashboard/DashboardSidebar.tsx]
import React from 'react';
import { Box, NavLink, ScrollArea, Text, Divider, Loader, Center, Avatar, Tooltip } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon, LayoutIcon, ImageIcon, SendIcon, BarChartIcon,
  UsersIcon, LayersIcon, ShieldIcon, MegaphoneIcon,
  MessageCircleIcon, InstagramIcon, MessagesSquareIcon, MessageSquareIcon,
  BuildingIcon, PaletteIcon, RadioTowerIcon, MailIcon
} from 'lucide-react';
import { useUserRole } from '../../auth/UserContext';
import { useAuth } from '../../auth/useAuth';

interface DashboardSidebarProps {
  collapsed?: boolean;
}

// Shared nav item styles — no bold
const NAV_STYLES = {
  root: {
    borderRadius: 6,
    padding: '5px 8px',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 400,
  },
};

// Section label shown only in expanded mode
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text
    size="xs"
    fw={400}
    c="dimmed"
    mb={3}
    mt={6}
    tt="uppercase"
    style={{ letterSpacing: '0.07em', fontSize: '0.66rem' }}
  >
    {children}
  </Text>
);

// A nav item that supports both collapsed (icon-only + tooltip) and expanded modes
interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, active, onClick, collapsed }) => {
  if (collapsed) {
    return (
      <Tooltip label={label} position="right" withArrow>
        <Box
          onClick={onClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 32,
            borderRadius: 8,
            margin: '2px auto',
            cursor: 'pointer',
            backgroundColor: active ? 'var(--mantine-color-blue-0)' : 'transparent',
            color: active ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-6)',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            if (!active) {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--mantine-color-gray-0)';
            }
          }}
          onMouseLeave={e => {
            if (!active) {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }
          }}
        >
          {icon}
        </Box>
      </Tooltip>
    );
  }

  return (
    <NavLink
      label={label}
      leftSection={icon}
      active={active}
      onClick={onClick}
      styles={NAV_STYLES}
    />
  );
};

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, isSuperAdmin, loadingRole, orgName } = useUserRole();
  const { user } = useAuth();

  const isActive = (path: string, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const sidebarWidth = collapsed ? 52 : 220;

  if (loadingRole) {
    return (
      <Box
        w={sidebarWidth}
        style={{
          borderRight: '1px solid var(--mantine-color-gray-2)',
          flexShrink: 0,
          height: '100vh',
          transition: 'width 0.2s ease',
          backgroundColor: 'white',
        }}
      >
        <Center h="100%"><Loader size="xs" /></Center>
      </Box>
    );
  }

  // Role label — no "Business Owner", just the actual role name
  let roleLabel = 'User';
  let roleColor = '#6b7280'; // gray
  if (isSuperAdmin) { roleLabel = 'Super Admin'; roleColor = '#ef4444'; }
  else if (role === 'operator') { roleLabel = 'Operator'; roleColor = '#3b82f6'; }
  else if (role === 'designer') { roleLabel = 'Designer'; roleColor = '#ec4899'; }
  else if (role === 'marketer') { roleLabel = 'Marketer'; roleColor = '#06b6d4'; }

  const canAccessDesign = role === 'operator' || role === 'designer';
  const canAccessMarketing = role === 'operator' || role === 'marketer';
  const canAccessCRM = role === 'operator';

  const displayName = orgName || user?.email?.split('@')[0] || 'My Organization';

  // Icon that visually represents the current profession
  const roleIconLg = isSuperAdmin ? <ShieldIcon size={15} />
    : role === 'designer'  ? <PaletteIcon size={15} />
    : role === 'marketer'  ? <RadioTowerIcon size={15} />
    : <BuildingIcon size={15} />; // operator / default

  const roleIconSm = isSuperAdmin ? <ShieldIcon size={10} />
    : role === 'designer'  ? <PaletteIcon size={10} />
    : role === 'marketer'  ? <RadioTowerIcon size={10} />
    : <BuildingIcon size={10} />;

  if (isSuperAdmin) {
    return (
      <Box
        w={sidebarWidth}
        style={{
          borderRight: '1px solid var(--mantine-color-gray-2)',
          flexShrink: 0,
          height: '100vh',
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          backgroundColor: 'white',
        }}
      >
        <ScrollArea h="100%">
          <Box p={collapsed ? 8 : 'sm'}>
            <NavItem
              label="Super Admin"
              icon={<ShieldIcon size={14} />}
              active={isActive('/admin')}
              onClick={() => navigate('/admin')}
              collapsed={collapsed}
            />
          </Box>
        </ScrollArea>
      </Box>
    );
  }

  return (
    <Box
      w={sidebarWidth}
      style={{
        borderRight: '1px solid var(--mantine-color-gray-2)',
        flexShrink: 0,
        height: '100vh',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        backgroundColor: 'white',
      }}
    >
      <ScrollArea h="100%" scrollbarSize={4}>

        {/* Org Branding */}
        <Box
          px={collapsed ? 6 : 10}
          pt={10}
          pb={8}
          style={{ borderBottom: '1px solid var(--mantine-color-gray-1)' }}
        >
          {collapsed ? (
            <Tooltip label={`${displayName} · ${roleLabel}`} position="right" withArrow>
              <Box style={{ display: 'flex', justifyContent: 'center' }}>
                <Avatar size={30} radius="md" color={roleColor.replace('#', '')} variant="light" style={{ color: roleColor }}>
                  {roleIconLg}
                </Avatar>
              </Box>
            </Tooltip>
          ) : (
            <Box>
              <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Avatar size={28} radius="md" variant="light" style={{ background: roleColor + '18', color: roleColor }}>
                  {roleIconLg}
                </Avatar>
                <Box style={{ overflow: 'hidden', flex: 1 }}>
                  <Text
                    size="xs"
                    fw={500}
                    truncate
                    style={{ lineHeight: 1.3, fontSize: '0.78rem' }}
                  >
                    {displayName}
                  </Text>
                  <Text
                    size="xs"
                    c="dimmed"
                    truncate
                    style={{ fontSize: '0.64rem', lineHeight: 1.2 }}
                  >
                    Marketing Platform
                  </Text>
                </Box>
              </Box>
              {/* Role chip */}
              <Box
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 4,
                  padding: '2px 7px',
                  backgroundColor: '#f3f4f6',
                }}
              >
                <Box style={{ color: roleColor }}>{roleIconSm}</Box>
                <Text style={{ fontSize: '0.66rem', color: roleColor, fontWeight: 400 }}>
                  {roleLabel}
                </Text>
              </Box>
            </Box>
          )}
        </Box>

        {/* Nav items */}
        <Box
          px={collapsed ? 6 : 8}
          py={8}
        >

          {/* GLOBAL */}
          {!collapsed && <SectionLabel>Global</SectionLabel>}
          <NavItem label="Dashboard" icon={<HomeIcon size={14} />} active={isActive('/', true)} onClick={() => navigate('/')} collapsed={collapsed} />
          {canAccessMarketing && (
            <>
              <NavItem label="Inbox" icon={<MessageCircleIcon size={14} />} active={isActive('/inbox', true)} onClick={() => navigate('/inbox')} collapsed={collapsed} />
              <NavItem label="Broadcast" icon={<SendIcon size={14} />} active={isActive('/campaign-manager')} onClick={() => navigate('/campaign-manager')} collapsed={collapsed} />
              <NavItem label="WA Templates" icon={<MessageSquareIcon size={14} />} active={isActive('/wa-templates', true)} onClick={() => navigate('/wa-templates')} collapsed={collapsed} />
              <NavItem label="Insight" icon={<BarChartIcon size={14} />} active={isActive('/analytics', true)} onClick={() => navigate('/analytics')} collapsed={collapsed} />
            </>
          )}

          {/* DESIGN */}
          {canAccessDesign && (
            <>
              {collapsed ? <Divider my={6} /> : <Divider my={8} />}
              {!collapsed && <SectionLabel>Design</SectionLabel>}
              <NavItem label="Design Dashboard" icon={<LayoutIcon size={14} />} active={isActive('/design-dashboard', true)} onClick={() => navigate('/design-dashboard')} collapsed={collapsed} />
              <NavItem label="Templates" icon={<ImageIcon size={14} />} active={isActive('/templates', true)} onClick={() => navigate('/templates')} collapsed={collapsed} />
              <NavItem label="Campaign Designs" icon={<MegaphoneIcon size={14} />} active={isActive('/campaigns', true)} onClick={() => navigate('/campaigns')} collapsed={collapsed} />
            </>
          )}

          {/* CRM */}
          {canAccessCRM && (
            <>
              {collapsed ? <Divider my={6} /> : <Divider my={8} />}
              {!collapsed && <SectionLabel>CRM</SectionLabel>}
              <NavItem label="Clients" icon={<UsersIcon size={14} />} active={isActive('/clients', true)} onClick={() => navigate('/clients')} collapsed={collapsed} />
              <NavItem label="Groups" icon={<LayersIcon size={14} />} active={isActive('/groups', true)} onClick={() => navigate('/groups')} collapsed={collapsed} />
              <NavItem label="Users" icon={<UsersIcon size={14} />} active={isActive('/organization/users', true)} onClick={() => navigate('/organization/users')} collapsed={collapsed} />
            </>
          )}

          {/* PLATFORM */}
          {canAccessCRM && (
            <>
              {collapsed ? <Divider my={6} /> : <Divider my={8} />}
              {!collapsed && <SectionLabel>Platform</SectionLabel>}
              <NavItem label="WhatsApp" icon={<MessageCircleIcon size={14} />} active={isActive('/integrations/whatsapp')} onClick={() => navigate('/integrations/whatsapp')} collapsed={collapsed} />
              <NavItem label="Instagram" icon={<InstagramIcon size={14} />} active={isActive('/integrations/instagram')} onClick={() => navigate('/integrations/instagram')} collapsed={collapsed} />
              <NavItem label="Messenger" icon={<MessagesSquareIcon size={14} />} active={isActive('/integrations/messenger')} onClick={() => navigate('/integrations/messenger')} collapsed={collapsed} />
              <NavItem label="Resend (Email)" icon={<MailIcon size={14} />} active={isActive('/integrations/resend')} onClick={() => navigate('/integrations/resend')} collapsed={collapsed} />
            </>
          )}

        </Box>
      </ScrollArea>
    </Box>
  );
};

export default DashboardSidebar;