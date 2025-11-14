import React, { useState } from 'react';
import { ScrollArea, Accordion, Group, Text, UnstyledButton, SimpleGrid, useMantineTheme, Divider, Box, MantineTheme } from '@mantine/core';
import { ImageIcon, TypeIcon, SquareIcon, CircleIcon, TriangleIcon, LayoutIcon, FileTextIcon, GridIcon, TableIcon, BoxIcon } from 'lucide-react';
// FIX: Import specific classes
import { Textbox, Rect } from 'fabric'; 
import { useFabricCanvas } from '../../context/CanvasContext';

interface SidebarProps {
  opened: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = (/* props */) => {
  const theme = useMantineTheme();
  const { canvas } = useFabricCanvas();
  const [activeTab, setActiveTab] = useState<string | null>('elements');

  const handleAddElement = (type: 'text' | 'shape') => {
    if (!canvas) return; 

    if (type === 'text') {
      // FIX: Use 'new Textbox'
      const text = new Textbox('New Text', {
        left: 50,
        top: 50,
        width: 200,
        fontSize: 24,
        fill: '#000',
      });
      canvas.add(text);
      canvas.setActiveObject(text);
    } else {
      // FIX: Use 'new Rect'
      const rect = new Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: theme.colors.blue[4],
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
    }
    canvas.renderAll();
  };
  
  const handleAddImage = () => {
    if (!canvas) return;
    alert('Image/Grid/Layout adding not implemented yet. Adding a placeholder shape.');
    handleAddElement('shape');
  };
  
  const ElementItem = ({
    icon: Icon,
    label,
    onClick
  }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
  }) => (
    <UnstyledButton 
      className="hover:bg-gray-0 dark:hover:bg-dark-6"
      style={(theme: MantineTheme) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.md,
        color: `light-dark(${theme.black}, ${theme.colors.dark[0]})`,
      })}
      onClick={onClick}
    >
      <Icon size={24} />
      <Text size="xs" mt={4}>
        {label}
      </Text>
    </UnstyledButton>
  );
  
  return <Box p="md" w={300}>
      <Box mt="xs">
        <Group justify="center" mb="md">
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
                  <ElementItem icon={SquareIcon} label="Square" onClick={() => handleAddElement('shape')} />
                  <ElementItem icon={CircleIcon} label="Circle" onClick={() => handleAddElement('shape')} />
                  <ElementItem icon={TriangleIcon} label="Triangle" onClick={() => handleAddElement('shape')} />
                  <ElementItem icon={BoxIcon} label="Line" onClick={() => handleAddElement('shape')} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="text">
              <Accordion.Control>Text</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={TypeIcon} label="Heading" onClick={() => handleAddElement('text')} />
                  <ElementItem icon={FileTextIcon} label="Paragraph" onClick={() => handleAddElement('text')} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="media">
              <Accordion.Control>Media</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={ImageIcon} label="Image" onClick={handleAddImage} />
                  <ElementItem icon={GridIcon} label="Grid" onClick={handleAddImage} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="layouts">
              <Accordion.Control>Layouts</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={LayoutIcon} label="Layout" onClick={handleAddImage} />
                  <ElementItem icon={TableIcon} label="Table" onClick={handleAddImage} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion> : <SimpleGrid cols={2} spacing="md">
            {Array(8).fill(0).map((_, i) => <div key={i} style={{
          height: 120,
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