import React, { useEffect, useRef } from 'react';
import { Paper, useMantineTheme, Center, Group, ActionIcon, Text } from '@mantine/core';
import { ZoomInIcon, ZoomOutIcon, MousePointerIcon } from 'lucide-react';
import { fabric } from 'fabric';
import { useCanvas } from './CanvasContext';

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

const Canvas: React.FC<CanvasProps> = ({ onElementSelect }) => {
  const theme = useMantineTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setCanvas, setSelectedElement } = useCanvas();

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 850,
        height: 500,
        backgroundColor: `light-dark(${theme.white}, ${theme.colors.dark[8]})`,
      });
      setCanvas(canvas);

      canvas.on('mouse:down', (options) => {
        if (options.target) {
          setSelectedElement(options.target as any);
          onElementSelect(options.target.id as string);
        } else {
          setSelectedElement(null);
          onElementSelect(null);
        }
      });

      return () => {
        canvas.dispose();
      };
    }
  }, [setCanvas, setSelectedElement, onElementSelect, theme]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-8">
        <Center>
          <Paper shadow="sm" p={0}>
            <canvas ref={canvasRef} />
          </Paper>
        </Center>
      </div>
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <Text size="xs" ta="center" color="dimmed">
          Page 1 of 1
        </Text>
      </div>
    </div>
  );
};

export default Canvas;