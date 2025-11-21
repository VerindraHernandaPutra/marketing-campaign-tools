import React, { useEffect, useState } from 'react';
import { Group, Menu, Avatar, Text, UnstyledButton, Box, Container } from '@mantine/core';
import { UserIcon, LogOutIcon } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

interface DashboardHeaderProps {
  colorScheme: string;
  toggleColorScheme: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username: string | null, avatar_url: string | null } | null>(null);

  // Fetch Profile Data
  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;
      
      // FIX: Use 'maybeSingle()' instead of 'single()'
      // 'single()' throws an error if 0 rows are returned (406 Not Acceptable).
      // 'maybeSingle()' returns null data without throwing an error if 0 rows are found.
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn("Profile fetch error (harmless if new user):", error.message);
      } else if (data) {
        setProfile(data);
      }
    };

    getProfile();
  }, [user]);

  const displayName = profile?.username || user?.email?.split('@')[0] || 'User';

  return (
    <Box component="header" h={70} className="border-b border-gray-200 dark:border-gray-700">
      <Container size="xl" className="h-full">
        <Group justify="space-between" className="h-full">
          {/* Logo / Brand */}
          <Group>
            <Text size="xl" fw={700} className="text-purple-600">
              Marketing Campaign Tools
            </Text>
          </Group>

          {/* Right Side: Profile Menu */}
          <Group gap="md">
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <Avatar 
                      src={profile?.avatar_url} 
                      color="blue" 
                      radius="xl"
                    >
                      {/* Fallback icon if no image */}
                      {!profile?.avatar_url && <UserIcon size={20} />}
                    </Avatar>
                    <div className="hidden sm:block">
                        {/* Display dynamic name */}
                        <Text size="sm" fw={500}>{displayName}</Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Account</Menu.Label>
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