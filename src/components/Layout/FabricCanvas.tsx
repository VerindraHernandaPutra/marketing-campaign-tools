import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';

interface FabricCanvasProps {
  setCanvas: (canvas: fabric.Canvas) => void;
  setActiveObject: (object: fabric.Object | null) => void;
}

const FabricCanvas: React.FC<FabricCanvasProps> = ({ setCanvas, setActiveObject }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 850,
      height: 500,
      backgroundColor: 'white',
    });
    setCanvas(canvas);

    // Add a sample object
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'red',
      width: 200,
      height: 200,
    });
    canvas.add(rect);

    canvas.on('selection:created', (e) => {
      setActiveObject(e.selected ? e.selected[0] : null);
    });

    canvas.on('selection:updated', (e) => {
      setActiveObject(e.selected ? e.selected[0] : null);
    });

    canvas.on('selection:cleared', () => {
      setActiveObject(null);
    });

    return () => {
      canvas.dispose();
    };
  }, [setCanvas, setActiveObject]);

  return <canvas ref={canvasRef} />;
};

export default FabricCanvas;
