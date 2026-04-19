import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Object as FabricObject } from 'fabric';
import { Box, useMantineTheme } from '@mantine/core';
import { useFabricCanvas } from '../../context/CanvasContext';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localCanvas, setLocalCanvas] = useState<FabricCanvas | null>(null);
  const [initialFitDone, setInitialFitDone] = useState(false);
  const theme = useMantineTheme();

  const { zoom, setZoom } = useFabricCanvas();
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // 📐 1. Auto-Fit to 75% of the TRUE Screen size
  useEffect(() => {
    // We use a small timeout to let the Sidebar and Header finish rendering first!
    const timer = setTimeout(() => {
      if (containerRef.current && !initialFitDone) {
        const { clientWidth, clientHeight } = containerRef.current;
        
        // We subtract 80px to account for the padding/scrollbars
        const availableWidth = clientWidth - 80;
        const availableHeight = clientHeight - 80;

        const exactFitScale = Math.min(
          availableWidth / width,
          availableHeight / height
        );

        const targetScale = exactFitScale * 0.75;

        setZoom(targetScale > 0 ? targetScale : 1);
        setInitialFitDone(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [width, height, initialFitDone, setZoom]);

  // 🎨 2. Initialize Canvas
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

  // 📂 3. Load Data Logic
  useEffect(() => {
    if (localCanvas && projectData) {
      try {
        const json = typeof projectData === 'string' ? JSON.parse(projectData) : projectData;
        localCanvas.backgroundColor = '#ffffff';

        localCanvas.loadFromJSON(json, () => {
          const currentZ = zoomRef.current;
          localCanvas.setDimensions({ width: width * currentZ, height: height * currentZ });
          localCanvas.setZoom(currentZ);
          
          if (!localCanvas.backgroundColor || localCanvas.backgroundColor === 'transparent') {
             localCanvas.backgroundColor = '#ffffff';
          }
          
          localCanvas.calcOffset(); 
          localCanvas.renderAll();

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

  // 🔍 4. Apply Zoom from Context
  useEffect(() => {
    if (localCanvas && initialFitDone) {
      localCanvas.setDimensions({ width: width * zoom, height: height * zoom });
      localCanvas.setZoom(zoom);
      localCanvas.calcOffset();
      localCanvas.requestRenderAll();
    }
  }, [localCanvas, width, height, zoom, initialFitDone]);

  // ⌨️ 5. Keyboard Shortcuts
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
      ref={containerRef}
      style={{
        flex: 1,           // 👈 Magic Fix 1: Fills the remaining screen space
        minHeight: 0,      // 👈 Magic Fix 2: Stops Flexbox from expanding infinitely
        minWidth: 0,       // 👈 Magic Fix 3: Stops Flexbox from expanding infinitely
        height: '100%',
        width: '100%',
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        background: `light-dark(${theme.colors.gray[1]}, ${theme.colors.dark[9]})`,
        overflow: 'auto', 
      }}
    >
      {/* The white board wrapper */}
      <div 
        style={{ 
          boxShadow: '0px 10px 30px rgba(0,0,0,0.15)', 
          background: '#fff',
          width: `${width * zoom}px`,   
          height: `${height * zoom}px`, 
          transition: 'width 0.2s ease, height 0.2s ease',
          margin: 'auto', // 👈 Ensures it stays centered even if you zoom in really close
        }}
      >
        <canvas ref={canvasRef} />
      </div>
    </Box>
  );
};

export default Canvas;