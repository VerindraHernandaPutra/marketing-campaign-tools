import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Object as FabricObject } from 'fabric';
import { Box, useMantineTheme } from '@mantine/core';

interface CanvasProps {
  setCanvas: (canvas: FabricCanvas | null) => void;
  setSelectedObject: (obj: FabricObject | null) => void;
  projectData: string | null;
  width: number;
  height: number;
}

const Canvas: React.FC<CanvasProps> = ({
  setCanvas,
  setSelectedObject,
  projectData,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localCanvas, setLocalCanvas] = useState<FabricCanvas | null>(null);
  const theme = useMantineTheme();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: width,
      height: height,
      backgroundColor: 'white',
      devicePixelRatio: window.devicePixelRatio,
      preserveObjectStacking: true,
    });

    const handleSelection = (options: { selected?: FabricObject[] }) => {
      if (options.selected && options.selected.length > 0) {
        setSelectedObject(options.selected[0]);
      } else {
        setSelectedObject(null);
      }
    };

    const handleSelectionCleared = () => {
      setSelectedObject(null);
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelectionCleared);

    setCanvas(canvas);
    setLocalCanvas(canvas);

    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleSelectionCleared);
      canvas.dispose();
      setCanvas(null);
      setLocalCanvas(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!localCanvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = localCanvas.getActiveObjects();
        if (activeObjects.length) {
            // Prevent deleting if editing text
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const activeObj = activeObjects[0] as any;
            if (activeObj.isEditing) return;

            localCanvas.discardActiveObject();
            activeObjects.forEach((obj) => {
                localCanvas.remove(obj);
            });
            localCanvas.requestRenderAll();
            setSelectedObject(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localCanvas, setSelectedObject]);

  // FIX: Improved Data Loading Logic
  useEffect(() => {
    if (localCanvas && projectData) {
      try {
        // Ensure we parse the string to a JSON object for Fabric
        const json = typeof projectData === 'string' ? JSON.parse(projectData) : projectData;
        
        localCanvas.loadFromJSON(json, () => {
          // 1. Render immediately after parsing
          localCanvas.requestRenderAll();
          
          // 2. Force another render after a short delay 
          // This fixes the "blank canvas" issue where images/fonts take a few ms to actually be ready for painting
          setTimeout(() => {
            localCanvas.requestRenderAll();
          }, 100);
        });
      } catch (error) {
        console.error("Error loading canvas JSON:", error);
      }
    }
  }, [localCanvas, projectData]);

  // Resize Logic
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
    if (localCanvas) {
      localCanvas.setWidth(width);
      localCanvas.setHeight(height);
      localCanvas.calcOffset(); // Important for centering
      localCanvas.requestRenderAll();
    }
  }, [localCanvas, width, height]);

  return (
    <Box
      style={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        background: `light-dark(${theme.colors.gray[1]}, ${theme.colors.dark[9]})`,
      }}
    >
      <canvas ref={canvasRef} />
    </Box>
  );
};

export default Canvas;