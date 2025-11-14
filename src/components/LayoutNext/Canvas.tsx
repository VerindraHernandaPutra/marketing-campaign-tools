import React, { useEffect, useRef } from 'react';
// 1. FIX: Rename the imported 'Canvas' to 'FabricCanvas'
//    We also remove 'TEvent' since it's not used
import { Canvas as FabricCanvas, Object as FabricObject } from 'fabric'; 
import { Box } from '@mantine/core';

interface CanvasProps {
  // 2. FIX: Update the type to use 'FabricCanvas'
  setCanvas: (canvas: FabricCanvas) => void;
  setSelectedObject: (obj: FabricObject | null) => void;
  projectData: string | null;
}

const Canvas: React.FC<CanvasProps> = ({ setCanvas, setSelectedObject, projectData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 3. FIX: Use 'new FabricCanvas'
    const canvas = new FabricCanvas(canvasRef.current, {
      width: 850,
      height: 500,
      backgroundColor: 'white',
      devicePixelRatio: window.devicePixelRatio,
    });

    if (projectData) {
      canvas.loadFromJSON(projectData, () => {
        canvas.renderAll();
      });
    }

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

    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleSelectionCleared);
      canvas.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  return (
    <Box style={{ flex: 1, display: 'grid', placeItems: 'center', background: '#f0f0f0' }}>
      <canvas ref={canvasRef} />
    </Box>
  );
};

export default Canvas;