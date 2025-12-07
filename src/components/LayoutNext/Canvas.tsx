import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Object as FabricObject } from 'fabric';
import { Box, useMantineTheme, useMantineColorScheme } from '@mantine/core';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [localCanvas, setLocalCanvas] = useState<FabricCanvas | null>(null);
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Destroy existing canvas if any (safety check)
    if (localCanvas) {
      try {
        localCanvas.dispose();
      } catch (e) {
        console.warn('Error disposing canvas', e);
      }
    }

    // Initialize Fabric
    const canvas = new FabricCanvas(canvasRef.current, {
      width: width,
      height: height,
      backgroundColor: '#ffffff', // Default white
      preserveObjectStacking: true,
      selection: true,
      controlsAboveOverlay: true,
    });

    // Event Listeners
    const handleSelection = (e: { selected?: FabricObject[] }) => {
      if (e.selected && e.selected.length > 0) {
        setSelectedObject(e.selected[0]);
      } else {
        setSelectedObject(null);
      }
    };

    const handleCleared = () => setSelectedObject(null);

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleCleared);

    setCanvas(canvas);
    setLocalCanvas(canvas);

    // Initial Render
    canvas.requestRenderAll();

    // Cleanup
    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleCleared);
      try {
        canvas.dispose();
      } catch (e) {
        console.warn('Cleanup error', e);
      }
      setCanvas(null);
      setLocalCanvas(null);
      setSelectedObject(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Handle Data Loading & Resizing
  useEffect(() => {
    if (!localCanvas) return;

    // 1. Handle Resize
    if (localCanvas.width !== width || localCanvas.height !== height) {
      localCanvas.setDimensions({ width, height });
    }

    // 2. Handle Data Load
    if (projectData) {
      const loadData = async () => {
        try {
          const json = typeof projectData === 'string' ? JSON.parse(projectData) : projectData;
          
          // Load data
          await localCanvas.loadFromJSON(json);
          
          // Force properties that might be missing in JSON
          if (!localCanvas.backgroundColor || localCanvas.backgroundColor === 'transparent') {
            localCanvas.backgroundColor = '#ffffff';
          }
          
          // Ensure dimensions from props override JSON dimensions (critical for resize)
          localCanvas.setDimensions({ width, height });
          
          localCanvas.requestRenderAll();
        } catch (err) {
          console.error("Error loading canvas data:", err);
          // Fallback if load fails
          localCanvas.backgroundColor = '#ffffff';
          localCanvas.requestRenderAll();
        }
      };
      loadData();
    } else {
        // No data? Just ensure background is white
        localCanvas.backgroundColor = '#ffffff';
        localCanvas.requestRenderAll();
    }

  }, [localCanvas, projectData, width, height]);

  return (
    <Box
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        // Dynamic background based on color scheme, removing conflicts
        backgroundColor: colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[1],
        overflow: 'auto',
      }}
    >
      {/* Key prop forces React to replace the element on re-mounts */}
      <canvas 
        ref={canvasRef} 
        key="fabric-canvas-element"
        style={{ width: width, height: height }} 
      />
    </Box>
  );
};

export default Canvas;