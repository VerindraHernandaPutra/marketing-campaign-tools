import { createContext, useContext } from 'react';
// FIX: Import specific classes
import { Canvas, Object as FabricObject } from 'fabric';

export interface CanvasContextType {
  // FIX: Update types
  canvas: Canvas | null;
  selectedObject: FabricObject | null;
}

export const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const useFabricCanvas = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useFabricCanvas must be used within a CanvasProvider');
  }
  return context;
};