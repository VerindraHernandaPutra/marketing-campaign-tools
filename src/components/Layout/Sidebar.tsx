import React, { useState } from 'react';
import { fabric } from 'fabric';
// MantineTheme ditambahkan
import { ScrollArea, Accordion, Group, Text, UnstyledButton, SimpleGrid, useMantineTheme, Divider, Box, MantineTheme } from '@mantine/core';
import { ImageIcon, TypeIcon, SquareIcon, CircleIcon, TriangleIcon, LayoutIcon, FileTextIcon, GridIcon, TableIcon, BoxIcon } from 'lucide-react';

interface SidebarProps {
  opened: boolean;
  onToggle: () => void;
  canvas: fabric.Canvas | null;
}

// Argumen diubah dari '({})' menjadi '()' untuk memperbaiki error 'no-empty-pattern'
const Sidebar: React.FC<SidebarProps> = ({ canvas }) => {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>('elements');
  const addShape = (shapeType: 'rect' | 'circle' | 'triangle' | 'line') => {
    if (!canvas) return;
    let shape;
    switch (shapeType) {
      case 'rect':
        shape = new fabric.Rect({
          width: 100,
          height: 100,
          fill: theme.colors.blue[6]
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          radius: 50,
          fill: theme.colors.green[6]
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          width: 100,
          height: 100,
          fill: theme.colors.yellow[6]
        });
        break;
      case 'line':
        shape = new fabric.Line([50, 100, 200, 200], {
          stroke: theme.colors.red[6],
          strokeWidth: 2
        });
        break;
    }
    canvas.add(shape);
    canvas.renderAll();
  };
  const addText = (textType: 'heading' | 'paragraph') => {
    if (!canvas) return;
    let text;
    switch (textType) {
      case 'heading':
        text = new fabric.Textbox('Heading', {
          fontSize: 28,
          fontWeight: 'bold'
        });
        break;
      case 'paragraph':
        text = new fabric.Textbox('Paragraph', {
          fontSize: 16
        });
        break;
    }
    canvas.add(text);
    canvas.renderAll();
  };
  const ElementItem = ({
    icon: Icon,
    label,
    onClick
  }: {
    // 'any' diubah menjadi 'React.ElementType'
    icon: React.ElementType;
    label: string;
    onClick: () => void;
  }) => (
    // 'sx' diubah menjadi 'style', 'theme' diberi tipe, dan '&:hover' dipindahkan ke 'className'
    <UnstyledButton 
      onClick={onClick}
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
                  <ElementItem icon={SquareIcon} label="Square" onClick={() => addShape('rect')} />
                  <ElementItem icon={CircleIcon} label="Circle" onClick={() => addShape('circle')} />
                  <ElementItem icon={TriangleIcon} label="Triangle" onClick={() => addShape('triangle')} />
                  <ElementItem icon={BoxIcon} label="Line" onClick={() => addShape('line')} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="text">
              <Accordion.Control>Text</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={TypeIcon} label="Heading" onClick={() => addText('heading')} />
                  <ElementItem icon={FileTextIcon} label="Paragraph" onClick={() => addText('paragraph')} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="media">
              <Accordion.Control>Media</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={ImageIcon} label="Image" onClick={() => {}} />
                  <ElementItem icon={GridIcon} label="Grid" onClick={() => {}} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="layouts">
              <Accordion.Control>Layouts</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={LayoutIcon} label="Layout" onClick={() => {}} />
                  <ElementItem icon={TableIcon} label="Table" onClick={() => {}} />
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