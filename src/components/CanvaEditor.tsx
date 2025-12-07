import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppShell } from '@mantine/core'; 
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import CanvasComponent from './LayoutNext/Canvas';
import PropertiesPanel from './Layout/PropertiesPanel';
import ResizeModal from './Layout/ResizeModal';
import DownloadModal from './Layout/DownloadModal';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Canvas, Object as FabricObject, Point } from 'fabric';
import { jsPDF } from 'jspdf'; 

import { CanvasContext, CanvasContextType } from '../context/CanvasContext';
import { useNotification } from '../context/NotificationContext';

type LoadedCanvasData = {
  width?: number;
  height?: number;
  [key: string]: unknown;
};

const CanvaEditor: React.FC = () => {
  const [sidebarOpened, setSidebarOpened] = useState(true);
  const [propertiesPanelOpened, setPropertiesPanelOpened] = useState(true);

  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [projectTitle, setProjectTitle] = useState('Loading...');

  const [dimensions, setDimensions] = useState({ width: 850, height: 500 });
  const [isResizeModalOpen, setIsResizeModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false); 

  const { projectId } = useParams<{ projectId: string }>();
  const [projectData, setProjectData] = useState<string | null>(null);
  const mainAreaRef = useRef<HTMLDivElement>(null);
  
  const notify = useNotification();

  // --- Optimized History State ---
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const isLocked = useRef(false);

  // --- 1. Save State Logic ---
  const saveState = useCallback(() => {
    if (!canvas || isLocked.current) return;

    redoStack.current = [];
    setCanRedo(false);

    try {
      const json = JSON.stringify(canvas.toJSON());
      undoStack.current.push(json);
      
      if (undoStack.current.length > 50) {
        undoStack.current.shift();
      }
      
      setCanUndo(true);
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }, [canvas]);

  // --- 2. Initialize Listeners ---
  useEffect(() => {
    if (!canvas) return;

    const initialState = JSON.stringify(canvas.toJSON());
    undoStack.current = [initialState];
    setCanUndo(true);

    const handleModification = () => {
        saveState();
    };

    canvas.on('object:added', handleModification);
    canvas.on('object:modified', handleModification);
    canvas.on('object:removed', handleModification);

    return () => {
      canvas.off('object:added', handleModification);
      canvas.off('object:modified', handleModification);
      canvas.off('object:removed', handleModification);
    };
  }, [canvas, saveState]);

  // --- 3. Undo Action ---
  const handleUndo = useCallback(async () => {
    if (!canvas || undoStack.current.length <= 1) return;

    isLocked.current = true;

    const currentState = undoStack.current.pop();
    if (currentState) {
      redoStack.current.push(currentState);
      setCanRedo(true);
    }

    const prevState = undoStack.current[undoStack.current.length - 1];

    if (prevState) {
      try {
        await canvas.loadFromJSON(JSON.parse(prevState));
        if (!canvas.backgroundColor || canvas.backgroundColor === 'transparent') {
            canvas.backgroundColor = '#ffffff';
        }
        canvas.renderAll();
      } catch (error) {
        console.error("Undo error:", error);
      }
    }

    setCanUndo(undoStack.current.length > 1);
    
    isLocked.current = false;
  }, [canvas]);

  // --- 4. Redo Action ---
  const handleRedo = useCallback(async () => {
    if (!canvas || redoStack.current.length === 0) return;

    isLocked.current = true;

    const nextState = redoStack.current.pop();
    
    if (nextState) {
      undoStack.current.push(nextState);
      setCanUndo(true);

      try {
        await canvas.loadFromJSON(JSON.parse(nextState));
        if (!canvas.backgroundColor || canvas.backgroundColor === 'transparent') {
            canvas.backgroundColor = '#ffffff';
        }
        canvas.renderAll();
      } catch (error) {
        console.error("Redo error:", error);
      }
    }

    setCanRedo(redoStack.current.length > 0);
    isLocked.current = false;
  }, [canvas]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            handleUndo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
            e.preventDefault();
            handleRedo();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // --- Data Fetching ---
  useEffect(() => {
    if (!projectId) return;
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('title, canvas_data')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project', error);
        notify.error('Load Failed', 'Could not load project data.');
      } else if (data) {
        setProjectTitle(data.title);
        if (data.canvas_data) {
          const loadedData = data.canvas_data as LoadedCanvasData;
          if (loadedData.width && loadedData.height) {
            setDimensions({ width: loadedData.width, height: loadedData.height });
          }
          setProjectData(JSON.stringify(loadedData)); 
        }
      }
    };
    fetchProject();
  }, [projectId, notify]);

  const handleSaveProject = async () => {
    if (!projectId || !canvas) return;
    
    const originalViewport = canvas.viewportTransform;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    
    const dataURL = canvas.toDataURL({ format: 'png', quality: 0.8, multiplier: 0.5 });

    if (originalViewport) canvas.setViewportTransform(originalViewport);

    const baseJson = canvas.toJSON();
    const canvasJson = { ...baseJson, width: dimensions.width, height: dimensions.height, backgroundColor: '#ffffff' };

    const { error } = await supabase.from('projects').update({ 
        canvas_data: canvasJson, 
        thumbnail_url: dataURL, 
        updated_at: new Date().toISOString() 
    }).eq('id', projectId);

    if (error) notify.error('Save Failed', error.message);
    else notify.success('Project Saved', 'Your design has been saved successfully.');
  };

  const handleDownload = (format: 'png' | 'jpeg' | 'pdf', quality: number, multiplier: number) => {
      if (!canvas) return;
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      if (format === 'pdf') {
          const imgData = canvas.toDataURL({ format: 'png', multiplier });
          const orientation = dimensions.width > dimensions.height ? 'l' : 'p';
          const pdf = new jsPDF(orientation, 'px', [dimensions.width, dimensions.height]);
          pdf.addImage(imgData, 'PNG', 0, 0, dimensions.width, dimensions.height);
          pdf.save(`${projectTitle}.pdf`);
      } else {
          const dataURL = canvas.toDataURL({ format, quality, multiplier });
          const link = document.createElement('a');
          link.href = dataURL;
          link.download = `${projectTitle}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
      notify.success('Download Started', `Your ${format.toUpperCase()} file is downloading.`);
  };

  const handleUpdateTitle = async (newTitle: string) => {
    if (!projectId) return;
    const { error } = await supabase.from('projects').update({ title: newTitle }).eq('id', projectId);
    if (error) notify.error('Update Failed', 'Could not rename project: ' + error.message);
    else setProjectTitle(newTitle);
  };

  const handleResize = (newDimensions: { width: number; height: number }) => {
    setDimensions(newDimensions);
    setIsResizeModalOpen(false);
    if (canvas) saveState(); 
    notify.show('Canvas Resized', `${newDimensions.width} x ${newDimensions.height} px`, 'info');
  };

  const handleZoomIn = () => {
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    const newZoom = Math.min(currentZoom * 1.2, 20);
    const center = new Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    canvas.zoomToPoint(center, newZoom);
    canvas.renderAll();
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    const newZoom = Math.max(currentZoom / 1.2, 0.1);
    const center = new Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    canvas.zoomToPoint(center, newZoom);
    canvas.renderAll();
  };

  const handleFitToCanvas = () => {
    if (!canvas || !mainAreaRef.current) return;
    const containerWidth = mainAreaRef.current.clientWidth;
    const containerHeight = mainAreaRef.current.clientHeight;
    
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    
    const scaleX = (containerWidth - 80) / dimensions.width; 
    const scaleY = (containerHeight - 80) / dimensions.height;
    const newZoom = Math.min(scaleX, scaleY, 1); 

    const panX = (containerWidth - dimensions.width * newZoom) / 2;
    const panY = (containerHeight - dimensions.height * newZoom) / 2;

    canvas.setZoom(newZoom);
    canvas.setViewportTransform([newZoom, 0, 0, newZoom, panX, panY]);
    canvas.renderAll();
  };

  const contextValue: CanvasContextType = {
    canvas,
    selectedObject
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      <AppShell 
        styles={{ main: { padding: 0, height: 'calc(100vh - 60px)' } }} 
        layout=""
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: true, desktop: !sidebarOpened } }} 
        aside={{ width: 300, breakpoint: 'sm', collapsed: { mobile: true, desktop: !propertiesPanelOpened || !selectedObject } }} 
        header={{ height: 60 }}
      >
        <AppShell.Header zIndex={200}>
          <Header 
            projectTitle={projectTitle}
            onUpdateTitle={handleUpdateTitle}
            onSave={handleSaveProject} 
            sidebarOpened={sidebarOpened} 
            onToggleSidebar={() => setSidebarOpened(!sidebarOpened)} 
            propertiesPanelOpened={propertiesPanelOpened} 
            onTogglePropertiesPanel={() => setPropertiesPanelOpened(!propertiesPanelOpened)} 
            onToggleResizeModal={() => setIsResizeModalOpen(true)}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitToCanvas={handleFitToCanvas}
            onToggleDownloadModal={() => setIsDownloadModalOpen(true)}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo} 
            canRedo={canRedo} 
          />
        </AppShell.Header>
        
        <AppShell.Navbar>
          {sidebarOpened && <Sidebar opened={sidebarOpened} onToggle={() => setSidebarOpened(!sidebarOpened)} />}
        </AppShell.Navbar>
        
        <AppShell.Aside>
          {propertiesPanelOpened && selectedObject && (
            <PropertiesPanel 
              opened={propertiesPanelOpened} 
              onToggle={() => setPropertiesPanelOpened(!propertiesPanelOpened)} 
            />
          )}
        </AppShell.Aside>
        
        <AppShell.Main ref={mainAreaRef}>
          <CanvasComponent 
            setCanvas={setCanvas}
            setSelectedObject={setSelectedObject}
            projectData={projectData}
            width={dimensions.width}
            height={dimensions.height}
          />
        </AppShell.Main>
      </AppShell>
      
      <ResizeModal opened={isResizeModalOpen} onClose={() => setIsResizeModalOpen(false)} onResize={handleResize} currentDimensions={dimensions} />
      <DownloadModal opened={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} onDownload={handleDownload} />
    </CanvasContext.Provider>
  );
};

export default CanvaEditor;