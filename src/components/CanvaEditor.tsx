import React, { useState, useEffect } from 'react';
import { AppShell, useMantineTheme } from '@mantine/core';
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import Canvas, { CanvasElement } from './Layout/Canvas'; // Import CanvasElement
import PropertiesPanel from './Layout/PropertiesPanel';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const mockElements: CanvasElement[] = [{
    id: 'text-1',
    type: 'text',
    content: 'Click to edit this text',
    position: { x: 100, y: 100 },
    size: { width: 300, height: 50 },
    style: { fontSize: 24, fontWeight: 'bold' }
}];

const CanvaEditor: React.FC = () => {
  const theme = useMantineTheme();
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [sidebarOpened, setSidebarOpened] = useState(true);
  const [propertiesPanelOpened, setPropertiesPanelOpened] = useState(true);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [projectTitle, setProjectTitle] = useState('Loading...');
  const { projectId } = useParams<{ projectId: string }>();

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
        setElements(data.canvas_data || mockElements);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleSaveProject = async () => {
    if (!projectId) return;
    
    console.log('Saving project...', elements);
    const { error } = await supabase
      .from('projects')
      .update({ canvas_data: elements }) 
      .eq('id', projectId);

    if (error) {
      alert('Error saving project: ' + error.message);
    } else {
      alert('Project Saved!');
    }
  };

  const handleElementSelect = (id: string | null) => {
    setSelectedElement(id);
    if (id && !propertiesPanelOpened) {
      setPropertiesPanelOpened(true);
    }
  };

  return <AppShell 
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
      collapsed: { mobile: true, desktop: !propertiesPanelOpened || !selectedElement }
    }} 
    header={{
      height: 60
    }}
  >
      <AppShell.Header>
        {/* --- THIS IS THE FIX --- */}
        {/* Pass the functions and variables as props here */}
        <Header 
          projectTitle={projectTitle} 
          onSave={handleSaveProject} 
          sidebarOpened={sidebarOpened} 
          onToggleSidebar={() => setSidebarOpened(!sidebarOpened)} 
          propertiesPanelOpened={propertiesPanelOpened} 
          onTogglePropertiesPanel={() => setPropertiesPanelOpened(!propertiesPanelOpened)} 
        />
        {/* ------------------------ */}
      </AppShell.Header>
      <AppShell.Navbar>
        {sidebarOpened && <Sidebar opened={sidebarOpened} onToggle={() => setSidebarOpened(!sidebarOpened)} />}
      </AppShell.Navbar>
      <AppShell.Aside>
        {propertiesPanelOpened && selectedElement && <PropertiesPanel opened={propertiesPanelOpened} onToggle={() => setPropertiesPanelOpened(!propertiesPanelOpened)} selectedElement={selectedElement} />}
      </AppShell.Aside>
      <AppShell.Main>
        <Canvas onElementSelect={handleElementSelect} selectedElement={selectedElement} elements={elements} setElements={setElements}/>
      </AppShell.Main>
    </AppShell>;
};

export default CanvaEditor;