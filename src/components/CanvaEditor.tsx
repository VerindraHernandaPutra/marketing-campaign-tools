// 1. FIX: Removed 'useMantineTheme' from import
import React, { useState, useEffect } from 'react';
import { AppShell } from '@mantine/core'; // 'useMantineTheme' removed
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import CanvasComponent from './LayoutNext/Canvas';
import PropertiesPanel from './Layout/PropertiesPanel';
import ResizeModal from './Layout/ResizeModal';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Canvas, Object as FabricObject } from 'fabric';

import { CanvasContext, CanvasContextType } from '../context/CanvasContext';

type LoadedCanvasData = {
  width?: number;
  height?: number;
  [key: string]: unknown;
};

const CanvaEditor: React.FC = () => {
  // 2. FIX: Removed 'theme' variable
  // const theme = useMantineTheme();
  const [sidebarOpened, setSidebarOpened] = useState(true);
  const [propertiesPanelOpened, setPropertiesPanelOpened] = useState(true);

  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [projectTitle, setProjectTitle] = useState('Loading...');

  const [dimensions, setDimensions] = useState({ width: 850, height: 500 });
  const [isResizeModalOpen, setIsResizeModalOpen] = useState(false);

  const { projectId } = useParams<{ projectId: string }>();
  
  const [projectData, setProjectData] = useState<string | null>(null);

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

  const handleResize = (newDimensions: { width: number; height: number }) => {
    setDimensions(newDimensions); 
    setIsResizeModalOpen(false);
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
            // 3. FIX: Explicitly set the main area's height to
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
            onSave={handleSaveProject} 
            sidebarOpened={sidebarOpened} 
            onToggleSidebar={() => setSidebarOpened(!sidebarOpened)} 
            propertiesPanelOpened={propertiesPanelOpened} 
            onTogglePropertiesPanel={() => setPropertiesPanelOpened(!propertiesPanelOpened)} 
            onToggleResizeModal={() => setIsResizeModalOpen(true)}
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
        
        <AppShell.Main>
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