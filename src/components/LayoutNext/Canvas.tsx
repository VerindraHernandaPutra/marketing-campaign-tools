import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Object as FabricObject, Rect } from 'fabric'; 
import { Box, useMantineTheme, useMantineColorScheme } from '@mantine/core';

interface CanvasProps {
  setCanvas: (canvas: FabricCanvas | null) => void;
  setSelectedObject: (obj: FabricObject | null) => void;
  projectData: string | null;
  width: number;
  height: number;
  onDataLoaded?: () => void;
  onContainerResize?: (w: number, h: number) => void;
  viewport?: { zoom: number; panX: number; panY: number };
}

const Canvas: React.FC<CanvasProps> = ({
  setCanvas,
  setSelectedObject,
  projectData,
  onDataLoaded,
  onContainerResize,
  width,
  height,
  viewport,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [localCanvas, setLocalCanvas] = useState<FabricCanvas | null>(null);
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const onDataLoadedRef = useRef(onDataLoaded);
  const onContainerResizeRef = useRef(onContainerResize);
  useEffect(() => {
    onDataLoadedRef.current = onDataLoaded;
    onContainerResizeRef.current = onContainerResize;
  });

  // --- Initialize Fabric canvas ---
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      preserveObjectStacking: true,
      selection: true,
      controlsAboveOverlay: true,
    });

    // Apply the clipPath! Added originX/Y to anchor it perfectly.
    canvas.clipPath = new Rect({
      left: 0,
      top: 0,
      width: width,
      height: height,
      originX: 'left', // Crucial to prevent centering bugs!
      originY: 'top',  // Crucial to prevent centering bugs!
      absolutePositioned: false, 
    });

    const handleSelection = (e: { selected?: FabricObject[] }) => {
      setSelectedObject(e.selected && e.selected.length > 0 ? e.selected[0] : null);
    };
    const handleCleared = () => setSelectedObject(null);

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleCleared);

    setCanvas(canvas);
    setLocalCanvas(canvas);
    canvas.requestRenderAll();

    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleCleared);
      try {
  canvas.dispose();
} catch {
  console.warn('Canvas dispose skipped.');
}
      setCanvas(null);
      setLocalCanvas(null);
      setSelectedObject(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Update clipPath on dimension resize
  useEffect(() => {
    if (!localCanvas) return;
    localCanvas.clipPath = new Rect({
      left: 0,
      top: 0,
      width: width,
      height: height,
      originX: 'left',
      originY: 'top',
      absolutePositioned: false,
    });
    localCanvas.requestRenderAll();
  }, [localCanvas, width, height]);

  // --- ResizeObserver (Debounced to stop flickering) ---
  useEffect(() => {
    if (!localCanvas || !containerRef.current) return;

    let timeoutId: NodeJS.Timeout;
    let lastWidth = 0;
    let lastHeight = 0;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        const h = Math.round(entry.contentRect.height);

        if (w <= 0 || h <= 0) return;
        if (w === lastWidth && h === lastHeight) return;

        lastWidth = w;
        lastHeight = h;

        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
          if (localCanvas) {
            localCanvas.setDimensions({ width: w, height: h });
            localCanvas.requestRenderAll();
          }
          onContainerResizeRef.current?.(w, h);
        }, 100); 
      }
    });

    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId); 
    };
  }, [localCanvas]);

  // --- Load project data ---
  useEffect(() => {
    if (!localCanvas) return;
    if (!projectData) {
      localCanvas.backgroundColor = '';
      localCanvas.requestRenderAll();
      return;
    }
    const loadData = async () => {
      try {
        const json = typeof projectData === 'string' ? JSON.parse(projectData) : projectData;
        await localCanvas.loadFromJSON(json);
        localCanvas.backgroundColor = '';
        localCanvas.requestRenderAll();
        onDataLoadedRef.current?.();
      } catch (err) {
        console.error('Error loading canvas data:', err);
      }
    };
    loadData();
  }, [localCanvas, projectData]);

  // --- Delete / Backspace ---
  useEffect(() => {
    if (!localCanvas) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const activeObj = localCanvas.getActiveObject() as FabricObject & { isEditing?: boolean };
      if (!activeObj || activeObj.isEditing) return;
      localCanvas.remove(activeObj);
      localCanvas.renderAll();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localCanvas]);

  const gray = colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[1];

  const pageStyle: React.CSSProperties = viewport
    ? {
        position: 'absolute',
        left: viewport.panX,
        top: viewport.panY,
        width: width * viewport.zoom,
        height: height * viewport.zoom,
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 16px rgba(0,0,0,0.16)',
        pointerEvents: 'none',
      }
    : { display: 'none' };

  return (
    <Box
      ref={containerRef}
      style={{
        flex: 1, 
        position: 'relative',
        height: '100%',
        width: '100%',
        backgroundColor: gray,
        overflow: 'hidden',
      }}
    >
      <div style={pageStyle} />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, display: 'block' }} />
    </Box>
  );
};

export default Canvas;