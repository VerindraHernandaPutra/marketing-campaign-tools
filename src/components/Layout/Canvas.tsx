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

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    if (localCanvas) {
      localCanvas.dispose();
    }

    const canvas = new FabricCanvas(canvasRef.current, {
      width: width,
      height: height,
      backgroundColor: '#ffffff',
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

  // Load Data Logic
  useEffect(() => {
    if (localCanvas && projectData) {
      try {
        const json = typeof projectData === 'string' ? JSON.parse(projectData) : projectData;

        // Ensure background is white immediately
        localCanvas.backgroundColor = '#ffffff';

        localCanvas.loadFromJSON(json, () => {
          // Ensure dimensions and background persist after load
          localCanvas.setDimensions({ width, height });
          
          if (!localCanvas.backgroundColor || localCanvas.backgroundColor === 'transparent') {
             localCanvas.backgroundColor = '#ffffff';
          }
          
          localCanvas.calcOffset(); 
          localCanvas.renderAll();

          // Safety render
          setTimeout(() => {
             if (localCanvas && !localCanvas.isDisposed) { 
                 localCanvas.requestRenderAll();
             }
          }, 100);
        });
      } catch (error) {
        console.error("Error loading canvas JSON:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCanvas, projectData]); 

  // FIX: Proper Resize Logic
  useEffect(() => {
    if (localCanvas) {
      // Use Fabric's method to resize, NOT manual DOM manipulation
      localCanvas.setDimensions({ width, height });
      localCanvas.calcOffset();
      localCanvas.requestRenderAll();
    }
  }, [localCanvas, width, height]);

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

  return (
    <Box
      style={{
        height: '100%',
        width: '100%',
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        background: `light-dark(${theme.colors.gray[1]}, ${theme.colors.dark[9]})`,
        overflow: 'auto', 
        padding: '40px' 
      }}
    >
      <canvas ref={canvasRef} />
    </Box>
  );
};

export default Canvas;