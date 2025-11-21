import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@mantine/core'; 
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import CanvasComponent from './LayoutNext/Canvas';
import PropertiesPanel from './Layout/PropertiesPanel';
import ResizeModal from './Layout/ResizeModal';
import DownloadModal from './Layout/DownloadModal'; // Import new modal
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Canvas, Object as FabricObject, Point } from 'fabric';
import { jsPDF } from 'jspdf'; // Make sure to install this: npm install jspdf

import { CanvasContext, CanvasContextType } from '../context/CanvasContext';

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
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false); // New State

  const { projectId } = useParams<{ projectId: string }>();
  
  const [projectData, setProjectData] = useState<string | null>(null);

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
          
          if (loadedData.width && loadedData.height) {
            setDimensions({ width: loadedData.width, height: loadedData.height });
          }
          
          setProjectData(JSON.stringify(loadedData)); 
        }
      }
    };
    fetchProject();
  }, [projectId]);

  const handleSaveProject = async () => {
    if (!projectId || !canvas) return;
    
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 0.8,
      multiplier: 0.2 
    });

    const baseJson = canvas.toJSON();
    const canvasJson = {
        ...baseJson,
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: '#ffffff'
    };

    console.log('Saving project...', canvasJson);
    
    const { error } = await supabase
      .from('projects')
      .update({ 
        canvas_data: canvasJson,
        thumbnail_url: dataURL,
        updated_at: new Date().toISOString()
      }) 
      .eq('id', projectId);

    if (error) {
      alert('Error saving project: ' + error.message);
    } else {
      alert('Project Saved!');
    }
  };

  // New: Advanced Download Handler
  const handleDownload = (format: 'png' | 'jpeg' | 'pdf', quality: number, multiplier: number) => {
      if (!canvas) return;

      // Reset zoom for clean export
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      if (format === 'pdf') {
          // PDF Logic
          const imgData = canvas.toDataURL({
              format: 'png',
              multiplier: multiplier,
          });
          
          // Calculate orientation
          const orientation = dimensions.width > dimensions.height ? 'l' : 'p';
          const pdf = new jsPDF(orientation, 'px', [dimensions.width, dimensions.height]);
          
          pdf.addImage(imgData, 'PNG', 0, 0, dimensions.width, dimensions.height);
          pdf.save(`${projectTitle}.pdf`);

      } else {
          // Image Logic
          const dataURL = canvas.toDataURL({
              format: format,
              quality: quality,
              multiplier: multiplier,
          });

          const link = document.createElement('a');
          link.href = dataURL;
          link.download = `${projectTitle}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
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

  const handleZoomIn = () => {
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    let newZoom = currentZoom * 1.2;
    if (newZoom > 20) newZoom = 20; 
    
    const center = new Point(
      mainAreaRef.current ? mainAreaRef.current.clientWidth / 2 : canvas.getWidth() / 2, 
      mainAreaRef.current ? mainAreaRef.current.clientHeight / 2 : canvas.getHeight() / 2
    );

    canvas.zoomToPoint(center, newZoom);
    canvas.renderAll();
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    let newZoom = currentZoom / 1.2;
    if (newZoom < 0.1) newZoom = 0.1; 
    
    const center = new Point(
      mainAreaRef.current ? mainAreaRef.current.clientWidth / 2 : canvas.getWidth() / 2, 
      mainAreaRef.current ? mainAreaRef.current.clientHeight / 2 : canvas.getHeight() / 2
    );

    canvas.zoomToPoint(center, newZoom);
    canvas.renderAll();
  };

  const handleFitToCanvas = () => {
    if (!canvas || !mainAreaRef.current) return;

    const containerWidth = mainAreaRef.current.clientWidth;
    const containerHeight = mainAreaRef.current.clientHeight;
    const designWidth = dimensions.width;
    const designHeight = dimensions.height;
    
    const newZoom = 1.0; 

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const panX = (containerWidth - designWidth * newZoom) / 2;
    const panY = (containerHeight - designHeight * newZoom) / 2;

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
        styles={{
          main: {
            padding: 0,
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
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitToCanvas={handleFitToCanvas}
            // Add prop to trigger download modal
            onToggleDownloadModal={() => setIsDownloadModalOpen(true)}
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
      
      <ResizeModal
        opened={isResizeModalOpen}
        onClose={() => setIsResizeModalOpen(false)}
        onResize={handleResize}
        currentDimensions={dimensions}
      />

      <DownloadModal
        opened={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onDownload={handleDownload}
      />
    </CanvasContext.Provider>
  );
};

export default CanvaEditor;