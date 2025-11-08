// 'useState' dihapus dari import
import React from 'react';
import { Group, TextInput, ActionIcon, Menu, Avatar, Text, UnstyledButton, Box, Container } from '@mantine/core';
import { SearchIcon, BellIcon, SunIcon, MoonIcon, UserIcon, SettingsIcon, LogOutIcon, CrownIcon } from 'lucide-react';

interface DashboardHeaderProps {
  colorScheme: string;
  toggleColorScheme: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  colorScheme,
  toggleColorScheme
}) => {
  const isDark = colorScheme === 'dark';
  return <Box component="header" h={70} className="border-b border-gray-200 dark:border-gray-700">
      <Container size="xl" className="h-full">
        {/* 'position' diubah menjadi 'justify' */}
        <Group justify="space-between" className="h-full">
          <Group>
            {/* 'weight' diubah menjadi 'fw' */}
            <Text size="xl" fw={700} className="text-purple-600">
              Marketing Campaign Tools
            </Text>
          </Group>
          {/* 'icon' diubah menjadi 'leftSection' */}
          <TextInput placeholder="Search designs, templates..." leftSection={<SearchIcon size={16} />} size="md" className="w-96" styles={{
          input: {
            borderRadius: 8
          }
        }} />
          {/* 'spacing' diubah menjadi 'gap' */}
          <Group gap="md">
            <ActionIcon size="lg" variant="subtle">
              <BellIcon size={20} />
            </ActionIcon>
            <ActionIcon size="lg" variant="subtle" onClick={toggleColorScheme}>
              {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </ActionIcon>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <UnstyledButton>
                  {/* 'spacing' diubah menjadi 'gap' */}
                  <Group gap="xs">
                    <Avatar color="purple" radius="xl">
                      <UserIcon size={20} />
                    </Avatar>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Account</Menu.Label>
                <Menu.Item leftSection={<UserIcon size={14} />}>
                  Profile
                </Menu.Item>
                <Menu.Item leftSection={<CrownIcon size={14} />}>
                  Upgrade to Pro
                </Menu.Item>
                <Menu.Item leftSection={<SettingsIcon size={14} />}>
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<LogOutIcon size={14} />} color="red">
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Container>
    </Box>;
};

export default DashboardHeader;