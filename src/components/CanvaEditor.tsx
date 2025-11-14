import React, { useState, useEffect, useRef } from 'react';
import { AppShell, useMantineTheme } from '@mantine/core';
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import CanvasComponent from './LayoutNext/Canvas'; // Renamed to avoid conflict
import PropertiesPanel from './Layout/PropertiesPanel';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Canvas, Object as FabricObject } from 'fabric';

import { CanvasContext, CanvasContextType } from '../context/CanvasContext';


const CanvaEditor: React.FC = () => {
  const theme = useMantineTheme();
  const [sidebarOpened, setSidebarOpened] = useState(true);
  const [propertiesPanelOpened, setPropertiesPanelOpened] = useState(true);

  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [projectTitle, setProjectTitle] = useState('Loading...');

  const { projectId } = useParams<{ projectId: string }>();
  
  const projectDataRef = useRef<string | null>(null);

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
          projectDataRef.current = JSON.stringify(data.canvas_data);
        }
      }
    };
    fetchProject();
  }, [projectId]);

  const handleSaveProject = async () => {
    if (!projectId || !canvas) return;
    
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

  const contextValue: CanvasContextType = {
    canvas,
    selectedObject
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      <AppShell 
        styles={{
          main: {
            background: `light-dark(${theme.colors.gray[0]}, ${theme.colors.dark[8]})`,
            padding: 0
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
            projectData={projectDataRef.current}
          />
        </AppShell.Main>
      </AppShell>
    </CanvasContext.Provider>
  );
};

export default CanvaEditor;