import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Object as FabricObject } from 'fabric';
// 1. FIX: Import 'useMantineTheme' to access theme colors
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
  // 2. FIX: Get the theme object
  const theme = useMantineTheme();

  // Effect to initialize the canvas ONCE
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: width,
      height: height,
      backgroundColor: 'white', // The canvas itself is always white
      devicePixelRatio: window.devicePixelRatio,
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
  }, []); // Runs once on mount

  // Effect to LOAD DATA when it arrives
  useEffect(() => {
    if (localCanvas && projectData) {
      localCanvas.loadFromJSON(projectData, () => {
        localCanvas.renderAll();
      });
    }
  }, [localCanvas, projectData]);

  // Effect to RESIZE canvas when props change
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
    if (localCanvas) {
      localCanvas.setWidth(width);
      localCanvas.setHeight(height);
      localCanvas.calcOffset();
      localCanvas.renderAll();
    }
  }, [localCanvas, width, height]);

  return (
    // 3. FIX: Change 'flex: 1' to 'height: 100%'
    // 4. FIX: Use a theme-aware background color for the centering box
    <Box
      style={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        background: `light-dark(${theme.colors.gray[1]}, ${theme.colors.dark[9]})`,
      }}
    >
      {/* This is the white <canvas> element */}
      <canvas ref={canvasRef} />
    </Box>
  );
};

export default Canvas;