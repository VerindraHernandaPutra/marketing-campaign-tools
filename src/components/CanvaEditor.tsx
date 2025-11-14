// 1. FIX: Removed 'useMantineTheme' and added 'useRef'
import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@mantine/core'; // 'useMantineTheme' removed
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import CanvasComponent from './LayoutNext/Canvas';
import PropertiesPanel from './Layout/PropertiesPanel';
import ResizeModal from './Layout/ResizeModal';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
// 2. FIX: Import 'Point' from fabric
import { Canvas, Object as FabricObject, Point } from 'fabric';

import { CanvasContext, CanvasContextType } from '../context/CanvasContext';

type LoadedCanvasData = {
  width?: number;
  height?: number;
  [key: string]: unknown;
};

const CanvaEditor: React.FC = () => {
  // ... (state variables remain the same) ...
  const [sidebarOpened, setSidebarOpened] = useState(true);
  const [propertiesPanelOpened, setPropertiesPanelOpened] = useState(true);

  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [projectTitle, setProjectTitle] = useState('Loading...');

  const [dimensions, setDimensions] = useState({ width: 850, height: 500 });
  const [isResizeModalOpen, setIsResizeModalOpen] = useState(false);

  const { projectId } = useParams<{ projectId: string }>();
  
  const [projectData, setProjectData] = useState<string | null>(null);

  // 3. FIX: Add ref for the main canvas area
  const mainAreaRef = useRef<HTMLDivElement>(null);

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
      } else if (data) {
        setProjectTitle(data.title);
        if (data.canvas_data) {
          const loadedData = data.canvas_data as LoadedCanvasData;
          setProjectData(JSON.stringify(loadedData)); 
          
          if (loadedData.width && loadedData.height) {
            setDimensions({ width: loadedData.width, height: loadedData.height });
          }
        }
      }
    };
    fetchProject();
  }, [projectId]);

  const handleSaveProject = async () => {
    if (!projectId || !canvas) return;
    
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    const canvasJson = canvas.toJSON(); 
    console.log('Saving project...', canvasJson);
    
    const { error } = await supabase
      .from('projects')
      .update({ canvas_data: canvasJson }) 
      .eq('id', projectId);

    if (error) {
      alert('Error saving project: ' + error.message);
    } else {
      alert('Project Saved!');
    }
  };

  const handleUpdateTitle = async (newTitle: string) => {
    if (!projectId) return;

    const { error } = await supabase
      .from('projects')
      .update({ title: newTitle })
      .eq('id', projectId);

    if (error) {
      alert('Error updating title: ' + error.message);
    } else {
      setProjectTitle(newTitle);
    }
  };

  const handleResize = (newDimensions: { width: number; height: number }) => {
    setDimensions(newDimensions);
    setIsResizeModalOpen(false);
  };

  // 4. FIX: Use 'new Point()' for zoom center
  const handleZoomIn = () => {
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    let newZoom = currentZoom * 1.2;
    if (newZoom > 20) newZoom = 20; // Max zoom 20x
    
    const center = new Point(
      mainAreaRef.current ? mainAreaRef.current.clientWidth / 2 : canvas.getWidth() / 2, 
      mainAreaRef.current ? mainAreaRef.current.clientHeight / 2 : canvas.getHeight() / 2
    );

    canvas.zoomToPoint(center, newZoom);
    canvas.renderAll();
  };

  // 5. FIX: Use 'new Point()' for zoom center
  const handleZoomOut = () => {
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    let newZoom = currentZoom / 1.2;
    if (newZoom < 0.1) newZoom = 0.1; // Min zoom 0.1x
    
    const center = new Point(
      mainAreaRef.current ? mainAreaRef.current.clientWidth / 2 : canvas.getWidth() / 2, 
      mainAreaRef.current ? mainAreaRef.current.clientHeight / 2 : canvas.getHeight() / 2
    );

    canvas.zoomToPoint(center, newZoom);
    canvas.renderAll();
  };

  // 6. FIX: Renamed to handleFitToCanvas and updated logic
  const handleFitToCanvas = () => {
    if (!canvas || !mainAreaRef.current) return;

    const containerWidth = mainAreaRef.current.clientWidth;
    const containerHeight = mainAreaRef.current.clientHeight;
    const designWidth = dimensions.width;
    const designHeight = dimensions.height;
    
    const newZoom = 1.0; // Reset zoom to 100%

    // Reset viewport transform (identity matrix)
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    // Calculate new pan to center the 100% canvas
    const panX = (containerWidth - designWidth * newZoom) / 2;
    const panY = (containerHeight - designHeight * newZoom) / 2;

    canvas.setZoom(newZoom);
    // Apply new zoom and pan
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
        styles={{
          main: {
            padding: 0,
            // 7. FIX: Explicitly set the main area's height to
            // fill the viewport (100vh) minus the header (60px).
            height: 'calc(100vh - 60px)',
          }
        }} 
        navbar={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: true, desktop: !sidebarOpened }
        }} 
        aside={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: true, desktop: !propertiesPanelOpened || !selectedObject }
        }} 
        header={{
          height: 60
        }}
      >
        <AppShell.Header>
          <Header 
            projectTitle={projectTitle}
            onUpdateTitle={handleUpdateTitle}
            onSave={handleSaveProject} 
            sidebarOpened={sidebarOpened} 
            onToggleSidebar={() => setSidebarOpened(!sidebarOpened)} 
            propertiesPanelOpened={propertiesPanelOpened} 
            onTogglePropertiesPanel={() => setPropertiesPanelOpened(!propertiesPanelOpened)} 
            onToggleResizeModal={() => setIsResizeModalOpen(true)}
            // 8. FIX: Pass zoom functions to Header
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitToCanvas={handleFitToCanvas} // 9. FIX: Renamed prop
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
        
        {/* 10. FIX: Add ref to AppShell.Main */}
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
      
      <ResizeModal
        opened={isResizeModalOpen}
        onClose={() => setIsResizeModalOpen(false)}
        onResize={handleResize}
        currentDimensions={dimensions}
      />
    </CanvasContext.Provider>
  );
};

export default CanvaEditor;