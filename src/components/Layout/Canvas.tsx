import React, { useEffect, useRef } from 'react';
import { Paper, useMantineTheme, Center, Text } from '@mantine/core';
import { Canvas as FabricCanvas, TPointerEventInfo } from 'fabric';

// 1. FIX: Import hook from its new file
import { useCanvas } from './useCanvas';
// 2. FIX: Import type from the context definition file
import { CanvasElement } from './CanvasContext';


interface CanvasProps {
  onElementSelect: (id: string | null) => void;
  selectedElement: string | null;
}

const Canvas: React.FC<CanvasProps> = ({ onElementSelect }) => {
  const theme = useMantineTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setCanvas, setSelectedElement } = useCanvas();

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = new FabricCanvas(canvasRef.current, {
        width: 850,
        height: 500,
        backgroundColor: `light-dark(${theme.white}, ${theme.colors.dark[8]})`,
      });
      setCanvas(canvas);

      canvas.on('mouse:down', (options: TPointerEventInfo) => {
        if (options.target) {
          // 3. FIX: Cast to the imported 'CanvasElement' type
          const selectedObject = options.target as CanvasElement;
          setSelectedElement(selectedObject);
          onElementSelect(selectedObject.id);
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