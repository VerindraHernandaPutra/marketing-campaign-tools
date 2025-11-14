import React, { useState } from 'react';
import { ScrollArea, Accordion, Group, Text, UnstyledButton, SimpleGrid, useMantineTheme, Divider, Box, MantineTheme } from '@mantine/core';
// 1. Import new icons
import { ImageIcon, TypeIcon, SquareIcon, CircleIcon, TriangleIcon, LayoutIcon, FileTextIcon, GridIcon, TableIcon, BoxIcon, HexagonIcon, MinusIcon } from 'lucide-react';
import { useFabricCanvas } from '../../context/CanvasContext';
// 2. Import new Fabric classes
import { Rect, Circle, Triangle, Line, Textbox, Ellipse, Polygon, Polyline } from 'fabric';

interface SidebarProps {
  opened: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = () => {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState<string | null>('elements');
  const { canvas } = useFabricCanvas();

  // 3. Update the shapeType to include new shapes
  const addShape = (shapeType: 'rect' | 'circle' | 'triangle' | 'line' | 'ellipse' | 'polygon' | 'polyline') => {
    if (!canvas) return;
    
    let shape;
    const options = {
      left: 100,
      top: 100,
      fill: theme.colors.blue[4],
      width: 100,
      height: 100,
    };

    // 4. Add new cases for the new shapes
    switch (shapeType) {
      case 'rect':
        shape = new Rect(options);
        break;
      case 'circle':
        shape = new Circle({ ...options, radius: 50 });
        break;
      case 'triangle':
        shape = new Triangle(options);
        break;
      case 'line':
        shape = new Line([50, 50, 150, 150], {
          left: 50,
          top: 50,
          stroke: theme.colors.blue[4],
          strokeWidth: 4,
        });
        break;
      case 'ellipse':
        shape = new Ellipse({
          left: 100,
          top: 100,
          rx: 75, // horizontal radius
          ry: 50, // vertical radius
          fill: theme.colors.grape[4],
        });
        break;
      case 'polygon': // We'll add a Hexagon
        shape = new Polygon([
          { x: 50, y: 0 },
          { x: 100, y: 25 },
          { x: 100, y: 75 },
          { x: 50, y: 100 },
          { x: 0, y: 75 },
          { x: 0, y: 25 }
        ], {
          left: 150,
          top: 150,
          fill: theme.colors.lime[4],
        });
        break;
      case 'polyline': // We'll add a "Z" shape
        shape = new Polyline([
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 0, y: 100 },
          { x: 100, y: 100 }
        ], {
          left: 200,
          top: 200,
          fill: '', // No fill for a line
          stroke: theme.colors.pink[4],
          strokeWidth: 4
        });
        break;
    }
    
    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    }
  };

  const addText = (textType: 'heading' | 'paragraph') => {
    if (!canvas) return;
    let text;
    // ... (rest of addText function is unchanged)
    switch (textType) {
      case 'heading':
        text = new Textbox('Heading', { left: 100, top: 100, fontFamily: 'Arial', fill: '#000000', fontSize: 48, fontWeight: 'bold' });
        break;
      case 'paragraph':
        text = new Textbox('Paragraph text', { left: 100, top: 100, fontFamily: 'Arial', fill: '#000000', fontSize: 24, width: 250 });
        break;
    }
    if (text) {
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
    }
  };

  const handleAddMedia = () => {
    alert('Media/Layouts not implemented yet. Adding a placeholder square.');
    if (canvas) {
      const rect = new Rect({ left: 150, top: 150, width: 100, height: 100, fill: theme.colors.green[4] });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
    }
  };

  const ElementItem = ({
    icon: Icon,
    label,
    onClick,
  }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
  }) => (
    <UnstyledButton
      onClick={onClick}
      className="hover:bg-gray-0 dark:hover:bg-dark-6"
      style={(theme: MantineTheme) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.md,
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
        {/* ... (Tabs) ... */}
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
                {/* 5. Add the new ElementItems to the grid */}
                <SimpleGrid cols={3} spacing="xs">
                  <ElementItem icon={SquareIcon} label="Square" onClick={() => addShape('rect')} />
                  <ElementItem icon={CircleIcon} label="Circle" onClick={() => addShape('circle')} />
                  <ElementItem icon={TriangleIcon} label="Triangle" onClick={() => addShape('triangle')} />
                  <ElementItem icon={BoxIcon} label="Line" onClick={() => addShape('line')} />
                  <ElementItem icon={CircleIcon} label="Ellipse" onClick={() => addShape('ellipse')} />
                  <ElementItem icon={HexagonIcon} label="Polygon" onClick={() => addShape('polygon')} />
                  <ElementItem icon={MinusIcon} label="Polyline" onClick={() => addShape('polyline')} />
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
                  <ElementItem icon={ImageIcon} label="Image" onClick={handleAddMedia} />
                  <ElementItem icon={GridIcon} label="Grid" onClick={handleAddMedia} />
                </SimpleGrid>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="layouts">
              <Accordion.Control>Layouts</Accordion.Control>
              <Accordion.Panel>
                <SimpleGrid cols={2} spacing="xs">
                  <ElementItem icon={LayoutIcon} label="Layout" onClick={handleAddMedia} />
                  <ElementItem icon={TableIcon} label="Table" onClick={handleAddMedia} />
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