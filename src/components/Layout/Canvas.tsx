import React, { useState } from 'react';
// 'Stack' dihapus dari import karena tidak terpakai
import { Paper, Text, useMantineTheme, Center, Group, ActionIcon } from '@mantine/core';
import { ZoomInIcon, ZoomOutIcon, MousePointerIcon } from 'lucide-react';

interface CanvasProps {
  onElementSelect: (id: string | null) => void;
  selectedElement: string | null;
}

interface CanvasElement {
  id: string;
  type: 'text' | 'shape';
  content: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  // 'any' diubah menjadi 'React.CSSProperties' untuk memperbaiki error ESLint
  style?: React.CSSProperties;
}

const Canvas: React.FC<CanvasProps> = ({
  onElementSelect,
  selectedElement
}) => {
  const theme = useMantineTheme();
  const [zoom, setZoom] = useState(100);
  const [elements] = useState<CanvasElement[]>([{
    id: 'text-1',
    type: 'text',
    content: 'Click to edit this text',
    position: {
      x: 100,
      y: 100
    },
    size: {
      width: 300,
      height: 50
    },
    style: {
      fontSize: 24,
      fontWeight: 'bold'
    }
  }, {
    id: 'text-2',
    type: 'text',
    content: 'Add your content here',
    position: {
      x: 100,
      y: 200
    },
    size: {
      width: 300,
      height: 100
    },
    style: {
      fontSize: 16
    }
  }, {
    id: 'shape-1',
    type: 'shape',
    content: 'rectangle',
    position: {
      x: 500,
      y: 150
    },
    size: {
      width: 200,
      height: 150
    },
    style: {
      backgroundColor: theme.colors.blue[1],
      borderRadius: 8
    }
  }]);
  const handleZoomIn = () => {
    if (zoom < 200) setZoom(zoom + 10);
  };
  const handleZoomOut = () => {
    if (zoom > 50) setZoom(zoom - 10);
  };
  return <div className="flex flex-col h-full">
      <div className="flex justify-center items-center p-2 border-b border-gray-200 dark:border-gray-700">
        <Group>
          <ActionIcon variant="subtle" onClick={handleZoomOut}>
            <ZoomOutIcon size={16} />
          </ActionIcon>
          <Text size="sm">{zoom}%</Text>
          <ActionIcon variant="subtle" onClick={handleZoomIn}>
            <ZoomInIcon size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle">
            <MousePointerIcon size={16} />
          </ActionIcon>
        </Group>
      </div>
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-8">
        <Center>
          {/* 'sx' diubah menjadi 'style' */}
          <Paper shadow="sm" p={0} style={{
          width: 850,
          height: 500,
          backgroundColor: 'white',
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center center',
          position: 'relative',
          transition: 'transform 0.2s ease'
        }}>
            {elements.map(element => <div key={element.id} onClick={() => onElementSelect(element.id)} style={{
            position: 'absolute',
            left: element.position.x,
            top: element.position.y,
            width: element.size.width,
            height: element.size.height,
            cursor: 'pointer',
            border: selectedElement === element.id ? `2px solid ${theme.colors.blue[6]}` : 'none',
            padding: element.type === 'text' ? 8 : 0,
            ...element.style
          }}>
                {element.type === 'text' && <Text>{element.content}</Text>}
              </div>)}
          </Paper>
        </Center>
      </div>
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        {/* 'align' diubah menjadi 'ta' */}
        <Text size="xs" ta="center" color="dimmed">
          Page 1 of 1
        </Text>
      </div>
    </div>;
};

export default Canvas;