import React, { useState } from 'react';
// MantineTheme ditambahkan
import { ScrollArea, Accordion, Group, Text, UnstyledButton, SimpleGrid, useMantineTheme, Divider, Box, MantineTheme } from '@mantine/core';
import { ImageIcon, TypeIcon, SquareIcon, CircleIcon, TriangleIcon, LayoutIcon, FileTextIcon, GridIcon, TableIcon, BoxIcon } from 'lucide-react';

interface SidebarProps {
  opened: boolean;
  onToggle: () => void;
}

// Argumen diubah dari '({})' menjadi '()' untuk memperbaiki error 'no-empty-pattern'
const Sidebar: React.FC<SidebarProps> = () => {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>('elements');
  const ElementItem = ({
    icon: Icon,
    label
  }: {
    // 'any' diubah menjadi 'React.ElementType'
    icon: React.ElementType;
    label: string;
  }) => (
    // 'sx' diubah menjadi 'style', 'theme' diberi tipe, dan '&:hover' dipindahkan ke 'className'
    <UnstyledButton 
      className="hover:bg-gray-0 dark:hover:bg-dark-6" // Tailwind untuk hover
      style={(theme: MantineTheme) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.md,
        // 'theme.colorScheme' diganti dengan 'light-dark()'
        color: `light-dark(${theme.black}, ${theme.colors.dark[0]})`,
      })}
    >
      <Icon size={24} />
      <Text size="xs" mt={4}>
        {label}
      </Text>
    </UnstyledButton>
  );
  
  return <Box p="md" w={300}>
      <Box mt="xs">
        {/* 'position' diubah menjadi 'justify' */}
        <Group justify="center" mb="md">
          {/* 'sx' diubah menjadi 'style', 'theme' diberi tipe, '&:hover' dipindahkan ke 'className', 'colorScheme' diganti 'light-dark()' */}
          <UnstyledButton 
            className="hover:bg-gray-0 dark:hover:bg-dark-6"
            style={(theme: MantineTheme) => ({
              padding: theme.spacing.xs,
              borderRadius: theme.radius.md,
              color: activeTab === 'templates' ? theme.colors.blue[6] : `light-dark(${theme.black}, ${theme.colors.dark[0]})`,
              backgroundColor: activeTab === 'templates' ? `light-dark(${theme.colors.gray[0]}, ${theme.colors.dark[6]})` : 'transparent',
              flex: 1,
              textAlign: 'center'
            })} 
            onClick={() => setActiveTab('templates')}
          >
            <Text>Templates</Text>
          </UnstyledButton>
          {/* 'sx' diubah menjadi 'style', 'theme' diberi tipe, '&:hover' dipindahkan ke 'className', 'colorScheme' diganti 'light-dark()' */}
          <UnstyledButton 
            className="hover:bg-gray-0 dark:hover:bg-dark-6"
            style={(theme: MantineTheme) => ({
              padding: theme.spacing.xs,
              borderRadius: theme.radius.md,
              color: activeTab === 'elements' ? theme.colors.blue[6] : `light-dark(${theme.black}, ${theme.colors.dark[0]})`,
              backgroundColor: activeTab === 'elements' ? `light-dark(${theme.colors.gray[0]}, ${theme.colors.dark[6]})` : 'transparent',
              flex: 1,
              textAlign: 'center'
            })} 
            onClick={() => setActiveTab('elements')}
          >
            <Text>Elements</Text>
          </UnstyledButton>
        </Group>
        <Divider mb="md" />
      </Box>
      <ScrollArea h="calc(100vh - 140px)" mx="-xs" px="xs">
        {activeTab === 'elements' ? <Accordion multiple defaultValue={['shapes']}>
            <Accordion.Item value="shapes">
              <Accordion.Control>Shapes</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={3} spacing="xs">
                  <ElementItem icon={SquareIcon} label="Square" />
                  <ElementItem icon={CircleIcon} label="Circle" />
                  <ElementItem icon={TriangleIcon} label="Triangle" />
                  <ElementItem icon={BoxIcon} label="Line" />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="text">
              <Accordion.Control>Text</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={TypeIcon} label="Heading" />
                  <ElementItem icon={FileTextIcon} label="Paragraph" />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="media">
              <Accordion.Control>Media</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={ImageIcon} label="Image" />
                  <ElementItem icon={GridIcon} label="Grid" />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="layouts">
              <Accordion.Control>Layouts</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={LayoutIcon} label="Layout" />
                  <ElementItem icon={TableIcon} label="Table" />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion> : <SimpleGrid cols={2} spacing="md">
            {Array(8).fill(0).map((_, i) => <div key={i} style={{
          height: 120,
          // 'theme.colorScheme' diganti dengan 'light-dark()'
          backgroundColor: `light-dark(${theme.colors.gray[2]}, ${theme.colors.dark[6]})`,
          borderRadius: theme.radius.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
                  <Text size="xs" color="dimmed">
                    Template {i + 1}
                  </Text>
                </div>)}
          </SimpleGrid>}
      </ScrollArea>
    </Box>;
};

export default Sidebar;