import React, { useState, ReactNode } from 'react';
import { Canvas, Object as FabricObject } from 'fabric';
import { CanvasContext, CanvasElement, CanvasContextProps } from './CanvasContext';

export const CanvasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [canvasTitle, setCanvasTitle] = useState('Untitled Design');

  const addElement = (element: FabricObject) => {
    if (canvas) {
      const newElement = element as CanvasElement;
      newElement.id = `element-${Date.now()}`;
      canvas.add(newElement);
      setElements(prev => [...prev, newElement]);
    }
  };

  const updateElement = (id: string, properties: Partial<FabricObject>) => {
    if (canvas) {
      const element = elements.find(el => el.id === id) as FabricObject | undefined;
      if (element) {
        element.set(properties);
        canvas.renderAll();
        setElements(prev => prev.map(el => (el.id === id ? (element as CanvasElement) : el)));
      }
    }
  };

  const value: CanvasContextProps = {
    canvas,
    setCanvas,
    elements,
    addElement,
    updateElement,
    selectedElement,
    setSelectedElement,
    canvasTitle,
    setCanvasTitle,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};