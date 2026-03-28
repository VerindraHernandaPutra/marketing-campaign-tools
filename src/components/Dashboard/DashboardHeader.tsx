import React, { useEffect, useState } from 'react';
import {
  Group, Menu, Avatar, Text, UnstyledButton, Box,
  Badge, Loader, TextInput, ActionIcon, Tooltip
} from '@mantine/core';
import {
  UserIcon, LogOutIcon, SearchIcon, SunIcon, SidebarIcon,
  SettingsIcon, BellIcon
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useUserRole } from '../../auth/UserContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

interface DashboardHeaderProps {
  colorScheme: string;
  toggleColorScheme: () => void;
  onToggleSidebar?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onToggleSidebar }) => {
  const { user, signOut } = useAuth();
  const { role, isSuperAdmin, loadingRole } = useUserRole();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username: string | null, avatar_url: string | null } | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        console.warn('Profile fetch error:', error.message);
      } else if (data) {
        setProfile(data);
      }
    };
    getProfile();
  }, [user]);

  const displayName = profile?.username || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  let roleLabel = 'USER';
  let roleColor = 'gray';
  if (isSuperAdmin) {
    roleLabel = 'SUPER ADMIN';
    roleColor = 'red';
  } else if (role) {
    roleLabel = role.toUpperCase();
    switch (role) {
      case 'operator': roleColor = 'blue'; break;
      case 'designer': roleColor = 'pink'; break;
      case 'marketer': roleColor = 'cyan'; break;
      default: roleColor = 'gray';
    }
  }

  return (
    <Box
      component="header"
      h={48}
      style={{
        borderBottom: '1px solid var(--mantine-color-gray-2)',
        backgroundColor: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Group h="100%" px="md" pl="lg" justify="space-between" gap={0}>
        {/* Left: Toggle + Search */}
        <Group gap="sm">
          <Tooltip label="Toggle sidebar" withArrow position="bottom">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              <SidebarIcon size={16} />
            </ActionIcon>
          </Tooltip>

          <TextInput
            placeholder="Cari..."
            leftSection={<SearchIcon size={13} />}
            rightSection={
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap', fontSize: 10 }}>⌘K</Text>
            }
            size="xs"
            radius="md"
            w={220}
            styles={{
              input: {
                fontSize: '0.75rem',
                height: 30,
                backgroundColor: 'var(--mantine-color-gray-0)',
                border: '1px solid var(--mantine-color-gray-2)',
              },
            }}
          />
        </Group>

        {/* Right: Icons + Avatar */}
        <Group gap="xs">
          <Tooltip label="Settings" withArrow position="bottom">
            <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Settings">
              <SettingsIcon size={15} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Notifications" withArrow position="bottom">
            <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Notifications">
              <BellIcon size={15} />
            </ActionIcon>
          </Tooltip>

          {/* Initials chip */}
          {!loadingRole ? (
            <Badge
              size="xs"
              variant="filled"
              color={roleColor}
              style={{ cursor: 'default', fontWeight: 700, letterSpacing: 0.5 }}
            >
              {initials}
            </Badge>
          ) : (
            <Loader size={10} color="gray" />
          )}

          {/* Avatar with dropdown */}
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <Avatar
                  src={profile?.avatar_url}
                  color={roleColor}
                  radius="xl"
                  size={28}
                  style={{ cursor: 'pointer' }}
                >
                  {!profile?.avatar_url && <UserIcon size={14} />}
                </Avatar>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>
                <Text size="xs" fw={600}>{displayName}</Text>
                <Text size="xs" c="dimmed">{roleLabel}</Text>
              </Menu.Label>
              <Menu.Divider />
              <Menu.Item
                leftSection={<UserIcon size={13} />}
                onClick={() => navigate('/profile')}
                style={{ fontSize: '0.78rem' }}
              >
                Profile
              </Menu.Item>
              <Menu.Item
                leftSection={<SunIcon size={13} />}
                style={{ fontSize: '0.78rem' }}
              >
                Appearance
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<LogOutIcon size={13} />}
                color="red"
                onClick={async () => await signOut()}
                style={{ fontSize: '0.78rem' }}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Box>
  );
};

export default DashboardHeader;