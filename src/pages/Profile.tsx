import React, { useState, useEffect } from 'react';
import { 
  MantineProvider, Flex, Container, Title, Paper, TextInput, Button, 
  Avatar, Group, Text, LoadingOverlay, Box 
} from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { UserIcon, SaveIcon } from 'lucide-react';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import '@mantine/core/styles.css';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(preferredColorScheme);
  const toggleColorScheme = (value?: 'light' | 'dark') => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  
  // Removed avatarUrl state since we deleted the input
  // We can still display a default avatar based on username/email if needed

  // Fetch Profile Data
  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;
      setLoading(true);
      
      // FIX: Use maybeSingle() to prevent 406 error if profile doesn't exist yet
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Error loading user data:', error.message);
      } else if (data) {
        setUsername(data.username || '');
      }
      setLoading(false);
    };

    getProfile();
  }, [user]);

  // Update Profile Data
  const updateProfile = async () => {
    if (!user) return;
    setLoading(true);

    const updates = {
      id: user.id,
      username,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      alert(error.message);
    } else {
      alert('Profile updated successfully!');
    }
    setLoading(false);
  };

  return (
    <MantineProvider theme={{}} forceColorScheme={colorScheme}>
      <div className="w-full min-h-screen bg-white dark:bg-gray-900">
        <DashboardHeader colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} />
        <Flex>
          <DashboardSidebar />
          <Box className="flex-1 p-8">
            <Container size="sm">
              <Title order={2} mb="xl">Profile Settings</Title>

              <Paper shadow="sm" p="xl" withBorder pos="relative">
                <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                
                <Group mb="xl">
                  <Avatar size={80} radius={80} color="blue">
                    <UserIcon size={40} />
                  </Avatar>
                  <div>
                    <Text size="lg" fw={600}>{username || 'User'}</Text>
                    <Text c="dimmed" size="sm">{user?.email}</Text>
                  </div>
                </Group>

                <TextInput
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  mb="md"
                  description="Your email address cannot be changed."
                />

                <TextInput
                  label="Username"
                  placeholder="Enter your display name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  mb="xl"
                />

                <Group justify="flex-end">
                  <Button 
                    leftSection={<SaveIcon size={16} />} 
                    onClick={updateProfile}
                    color="blue"
                  >
                    Save Changes
                  </Button>
                </Group>
              </Paper>
            </Container>
          </Box>
        </Flex>
      </div>
    </MantineProvider>
  );
};

export default Profile;