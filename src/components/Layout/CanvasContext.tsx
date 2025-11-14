import React, { createContext, useState, useContext, ReactNode } from 'react';
import { fabric } from 'fabric';

interface CanvasElement extends fabric.Object {
  id: string;
}

interface CanvasContextProps {
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas) => void;
  elements: CanvasElement[];
  addElement: (element: fabric.Object) => void;
  updateElement: (id: string, properties: Partial<fabric.Object>) => void;
  selectedElement: CanvasElement | null;
  setSelectedElement: (element: CanvasElement | null) => void;
  canvasTitle: string;
  setCanvasTitle: (title: string) => void;
}

const CanvasContext = createContext<CanvasContextProps | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [canvasTitle, setCanvasTitle] = useState('Untitled Design');

  const addElement = (element: fabric.Object) => {
    if (canvas) {
      const newElement = element as CanvasElement;
      newElement.id = `element-${Date.now()}`;
      canvas.add(newElement);
      setElements(prev => [...prev, newElement]);
    }
  };

  const updateElement = (id: string, properties: Partial<fabric.Object>) => {
    if (canvas) {
      const element = elements.find(el => el.id === id) as fabric.Object | undefined;
      if (element) {
        element.set(properties);
        canvas.renderAll();
        setElements(prev => prev.map(el => (el.id === id ? (element as CanvasElement) : el)));
      }
    }
  };

  return (
    <CanvasContext.Provider
      value={{
        canvas,
        setCanvas,
        elements,
        addElement,
        updateElement,
        selectedElement,
        setSelectedElement,
        canvasTitle,
        setCanvasTitle,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};