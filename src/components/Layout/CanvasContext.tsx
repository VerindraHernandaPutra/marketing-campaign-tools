import { createContext } from 'react';
import { Canvas, Object as FabricObject } from 'fabric';

// Exported so other files can use this type
export interface CanvasElement extends FabricObject {
  id: string;
}

export interface CanvasContextProps {
  canvas: Canvas | null;
  setCanvas: (canvas: Canvas) => void;
  elements: CanvasElement[];
  addElement: (element: FabricObject) => void;
  updateElement: (id: string, properties: Partial<FabricObject>) => void;
  selectedElement: CanvasElement | null;
  setSelectedElement: (element: CanvasElement | null) => void;
  canvasTitle: string;
  setCanvasTitle: (title: string) => void;
}

// Export the context object
export const CanvasContext = createContext<CanvasContextProps | undefined>(undefined);