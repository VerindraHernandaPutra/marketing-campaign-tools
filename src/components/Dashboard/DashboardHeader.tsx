import React, { useEffect, useState } from 'react';
import { Group, Menu, Avatar, Text, UnstyledButton, Box, Container, Badge, Loader } from '@mantine/core';
import { UserIcon, LogOutIcon } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useUserRole } from '../../auth/UserContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

interface DashboardHeaderProps {
  colorScheme: string;
  toggleColorScheme: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = () => {
  const { user, signOut } = useAuth();
  const { role, isSuperAdmin, loadingRole } = useUserRole();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username: string | null, avatar_url: string | null } | null>(null);

  // Fetch Profile Data
  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn("Profile fetch error:", error.message);
      } else if (data) {
        setProfile(data);
      }
    };

    getProfile();
  }, [user]);

  const displayName = profile?.username || user?.email?.split('@')[0] || 'User';

  // --- Role Indicator Logic ---
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
    <Box component="header" h={70} className="border-b border-gray-200 dark:border-gray-700">
      <Container size="xl" className="h-full">
        <Group justify="space-between" className="h-full">
          {/* Logo / Brand */}
          <Group>
            <Text size="xl" fw={700} className="text-purple-600">
              Marketing Campaign Tools
            </Text>
            {/* Header Badge Indicator */}
            {!loadingRole && (
               <Badge variant="light" color={roleColor} size="sm" className="hidden md:block">
                  {roleLabel} CONSOLE
               </Badge>
            )}
          </Group>

          {/* Right Side: Profile Menu */}
          <Group gap="md">
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <div className="text-right hidden sm:block">
                        <Text size="sm" fw={500} style={{ lineHeight: 1.2 }}>{displayName}</Text>
                        {loadingRole ? (
                            <Loader size={10} color="gray" />
                        ) : (
                            <Text size="xs" c="dimmed" style={{ lineHeight: 1 }}>{roleLabel}</Text>
                        )}
                    </div>
                    <Avatar 
                      src={profile?.avatar_url} 
                      color={roleColor} 
                      radius="xl"
                    >
                      {!profile?.avatar_url && <UserIcon size={20} />}
                    </Avatar>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Account ({roleLabel})</Menu.Label>
                <Menu.Item 
                  leftSection={<UserIcon size={14} />} 
                  onClick={() => navigate('/profile')}
                >
                  Profile
                </Menu.Item>
                
                <Menu.Divider />
                
                <Menu.Item 
                  leftSection={<LogOutIcon size={14} />} 
                  color="red" 
                  onClick={async () => await signOut()}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Container>
    </Box>
  );
};

export default DashboardHeader;