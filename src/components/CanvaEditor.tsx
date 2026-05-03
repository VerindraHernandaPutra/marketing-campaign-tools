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
import { useQueryClient } from '@tanstack/react-query';

import { CanvasContext, CanvasContextType } from '../context/CanvasContext';
import { useNotification } from '../context/NotificationContext';

type LoadedCanvasData = {
  width?: number;
  height?: number;
  [key: string]: unknown;
};

const CanvaEditor: React.FC = () => {
  const [zoom, setZoom] = useState<number>(1);
  const [viewport, setViewport] = useState({ zoom: 1, panX: 0, panY: 0 }); // Tracks white paper
  
  const [sidebarOpened, setSidebarOpened] = useState(true);
  const [propertiesPanelOpened, setPropertiesPanelOpened] = useState(true);

  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [projectTitle, setProjectTitle] = useState('Loading...');
  const [isTemplate, setIsTemplate] = useState<boolean | undefined>(undefined);

  const [dimensions, setDimensions] = useState({ width: 850, height: 500 });
  const [isResizeModalOpen, setIsResizeModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false); 

  const { projectId } = useParams<{ projectId: string }>();
  const [projectData, setProjectData] = useState<string | null>(null);
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const notify = useNotification();

  // --- Optimized History State ---
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isLocked = useRef(false);

  const saveState = useCallback(() => {
    if (!canvas || isLocked.current) return;
    redoStack.current = [];
    setCanRedo(false);
    try {
      const json = JSON.stringify(canvas.toJSON());
      undoStack.current.push(json);
      if (undoStack.current.length > 50) undoStack.current.shift();
      setCanUndo(true);
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    const initialState = JSON.stringify(canvas.toJSON());
    undoStack.current = [initialState];
    setCanUndo(true);

    const handleModification = () => saveState();
    canvas.on('object:added', handleModification);
    canvas.on('object:modified', handleModification);
    canvas.on('object:removed', handleModification);

    return () => {
      canvas.off('object:added', handleModification);
      canvas.off('object:modified', handleModification);
      canvas.off('object:removed', handleModification);
    };
  }, [canvas, saveState]);

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

  // ==========================================
  // 🌟 FIX 1: Perfect Fit-to-Canvas Logic
  // ==========================================
  const handleFitToCanvas = useCallback(() => {
    if (!canvas || !mainAreaRef.current) return;
    
    const containerWidth = mainAreaRef.current.clientWidth;
    const containerHeight = mainAreaRef.current.clientHeight;
    
    // Prevent running if the UI hasn't fully rendered yet to avoid disappearing canvas!
    if (containerWidth <= 0 || containerHeight <= 0) return;
    
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    
    const scaleX = containerWidth / dimensions.width; 
    const scaleY = containerHeight / dimensions.height;
    const newZoom = Math.min(scaleX, scaleY, 1) * 0.85; 

    const visualOffsetLeft = 270;
    const panX =
      (containerWidth - dimensions.width * newZoom) / 2 - visualOffsetLeft;
    const panY = (containerHeight - dimensions.height * newZoom) / 2;

    canvas.setZoom(newZoom);
    canvas.setViewportTransform([newZoom, 0, 0, newZoom, panX, panY]);
    
    // CRITICAL: Update the viewport state so the white paper div follows the canvas!
    setViewport({ zoom: newZoom, panX, panY });
    setZoom(newZoom);
    
    canvas.renderAll();
  }, [canvas, dimensions]);

  // Initial Auto-Fit
  const [initialFitDone, setInitialFitDone] = useState(false);
  useEffect(() => {
    if (canvas && mainAreaRef.current && dimensions.width > 0 && !initialFitDone) {
      // 350ms delay gives Mantine time to open the sidebar before calculating center
      setTimeout(() => {
        handleFitToCanvas();
        setInitialFitDone(true);
      }, 350); 
    }
  }, [canvas, dimensions, initialFitDone, handleFitToCanvas]);

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

  useEffect(() => {
    if (!projectId) return;
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('title, canvas_data, is_template')
        .eq('id', projectId)
        .single();
      if (error) {
        notify.error('Load Failed', 'Could not load project data.');
      } else if (data) {
        setProjectTitle(data.title);
        setIsTemplate(data.is_template);
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

  // ==========================================
  // 🌟 FIX 2: Export Helper with ClipPath Bypass
  // ==========================================
  const withDesignDimensions = async <T,>(fn: () => T | Promise<T>): Promise<T> => {
  if (!canvas || !mainAreaRef.current) return await fn();

  const vpt = canvas.viewportTransform
    ? [...canvas.viewportTransform]
    : [1, 0, 0, 1, 0, 0];

  const containerW = mainAreaRef.current.clientWidth;
  const containerH = mainAreaRef.current.clientHeight;

  const originalBg = canvas.backgroundColor;
  const originalClip = canvas.clipPath;

  try {
    canvas.discardActiveObject();
    canvas.setDimensions({ width: dimensions.width, height: dimensions.height });
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.backgroundColor = '#ffffff';
    canvas.clipPath = undefined;
    canvas.renderAll();

    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => setTimeout(resolve, 50));

    return await fn();
  } finally {
    canvas.backgroundColor = originalBg || '';
    canvas.clipPath = originalClip;
    canvas.setDimensions({ width: containerW, height: containerH });
    canvas.setViewportTransform(vpt as [number, number, number, number, number, number]);
    canvas.renderAll();
  }
};

  const handleSaveProject = async () => {
    if (!projectId || !canvas) return;
    let thumbnailUrl: string | null = null;
    
    try {
      const dataURL = await withDesignDimensions(() =>
        canvas.toDataURL({
          format: 'png',
          quality: 0.8,
          multiplier: 0.5,
          left: 0,
          top: 0,
          width: dimensions.width,
          height: dimensions.height,
          enableRetinaScaling: false,
        })
      );

      const blob = await fetch(dataURL).then(r => r.blob());
      const filePath = `${projectId}.png`;
      const { error: uploadError } = await supabase.storage
        .from('project-thumbnails')
        .upload(filePath, blob, { upsert: true, contentType: 'image/png' });

      if (!uploadError) {
        const { data } = supabase.storage.from('project-thumbnails').getPublicUrl(filePath);
        // Cache buster ensures the fresh thumbnail appears!
        thumbnailUrl = `${data.publicUrl}?t=${Date.now()}`;
      } else {
        console.error('Thumbnail upload failed:', uploadError);
        // Fallback: store inline data URL so preview still updates when storage policies block upload.
        thumbnailUrl = dataURL;
      }
    } catch (error) {
      console.error("Error saving thumbnail:", error);
    }

    const baseJson = canvas.toJSON();
    const canvasJson = { ...baseJson, width: dimensions.width, height: dimensions.height, backgroundColor: '#ffffff' };
    const updatePayload: Record<string, unknown> = {
      canvas_data: canvasJson,
      updated_at: new Date().toISOString(),
    };
    
    if (thumbnailUrl) updatePayload.thumbnail_url = thumbnailUrl;
    const { error } = await supabase.from('projects').update(updatePayload).eq('id', projectId);

    if (error) notify.error('Save Failed', error.message);
    else {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      notify.success('Project Saved', 'Your design has been saved successfully.');
    }
  };

  const handleDownload = async (format: 'png' | 'jpeg' | 'pdf', quality: number, multiplier: number) => {
      if (!canvas) return;
      await withDesignDimensions(() => {
          if (format === 'pdf') {
              const imgData = canvas.toDataURL({ format: 'png', multiplier, left: 0, top: 0, width: dimensions.width, height: dimensions.height });
              const orientation = dimensions.width > dimensions.height ? 'l' : 'p';
              const pdf = new jsPDF(orientation, 'px', [dimensions.width, dimensions.height]);
              pdf.addImage(imgData, 'PNG', 0, 0, dimensions.width, dimensions.height);
              pdf.save(`${projectTitle}.pdf`);
          } else {
              const dataURL = canvas.toDataURL({ format, quality, multiplier, left: 0, top: 0, width: dimensions.width, height: dimensions.height });
              const link = document.createElement('a');
              link.href = dataURL;
              link.download = `${projectTitle}.${format}`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      });
      notify.success('Download Started', `Your ${format.toUpperCase()} file is downloading.`);
  };

  const handleUpdateTitle = async (newTitle: string) => {
    if (!projectId) return;
    const { error } = await supabase.from('projects').update({ title: newTitle }).eq('id', projectId);
    if (error) notify.error('Update Failed', error.message);
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
    
    // CRITICAL: Update state so white paper follows zoom!
    const vpt = canvas.viewportTransform!;
    setViewport({ zoom: vpt[0], panX: vpt[4], panY: vpt[5] });
    setZoom(vpt[0]);
    canvas.renderAll();
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    const newZoom = Math.max(currentZoom / 1.2, 0.1);
    const center = new Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    canvas.zoomToPoint(center, newZoom);
    
    // CRITICAL: Update state so white paper follows zoom!
    const vpt = canvas.viewportTransform!;
    setViewport({ zoom: vpt[0], panX: vpt[4], panY: vpt[5] });
    setZoom(vpt[0]);
    canvas.renderAll();
  };

  const contextValue: CanvasContextType = { canvas, selectedObject, zoom, setZoom };

  return (
    <CanvasContext.Provider value={contextValue}>
      <AppShell 
        padding={0} // Fixed missing padding prop
        styles={{ 
          main: { 
            height: 'calc(100vh - 60px)',
            overflow: 'hidden',
            display: 'flex',         // Ensures canvas container can expand
            flexDirection: 'column'  // Ensures canvas container can expand
          } 
        }} 
        layout="default" // Replaced invalid layout="" 
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: true, desktop: !sidebarOpened } }} 
        aside={{ width: 300, breakpoint: 'sm', collapsed: { mobile: true, desktop: !propertiesPanelOpened || !selectedObject } }} 
        header={{ height: 60 }}
      >
        <AppShell.Header zIndex={200}>
          <Header 
            projectTitle={projectTitle}
            isTemplate={isTemplate}
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
            viewport={viewport} // Make sure viewport is passed down!
          />
        </AppShell.Main>
      </AppShell>
      
      <ResizeModal opened={isResizeModalOpen} onClose={() => setIsResizeModalOpen(false)} onResize={handleResize} currentDimensions={dimensions} />
      <DownloadModal opened={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} onDownload={handleDownload} />
    </CanvasContext.Provider>
  );
};

export default CanvaEditor;