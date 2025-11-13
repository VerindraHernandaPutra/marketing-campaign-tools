import React, { useState } from 'react';
import { AppShell, useMantineTheme } from '@mantine/core';
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import Canvas from './Layout/Canvas';
import PropertiesPanel from './Layout/PropertiesPanel';

const CanvaEditor: React.FC = () => {
  const theme = useMantineTheme();
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [sidebarOpened, setSidebarOpened] = useState(true);
  const [propertiesPanelOpened, setPropertiesPanelOpened] = useState(true);

  const handleElementSelect = (id: string | null) => {
    setSelectedElement(id);
    if (id && !propertiesPanelOpened) {
      setPropertiesPanelOpened(true);
    }
  };

  return <AppShell 
    styles={{
      main: {
        // 'theme.colorScheme' diganti dengan fungsi 'light-dark()'
        background: `light-dark(${theme.colors.gray[0]}, ${theme.colors.dark[8]})`,
        padding: 0
      }
    }} 
    navbar={{
      width: 300,
      breakpoint: 'sm',
      // 'collapsed' diubah menjadi objek untuk v7
      collapsed: { mobile: true, desktop: !sidebarOpened }
    }} 
    aside={{
      width: 300,
      breakpoint: 'sm',
      // 'collapsed' diubah menjadi objek untuk v7
      collapsed: { mobile: true, desktop: !propertiesPanelOpened || !selectedElement }
    }} 
    header={{
      height: 60
    }}
  >
      <AppShell.Header>
        <Header sidebarOpened={sidebarOpened} onToggleSidebar={() => setSidebarOpened(!sidebarOpened)} propertiesPanelOpened={propertiesPanelOpened} onTogglePropertiesPanel={() => setPropertiesPanelOpened(!propertiesPanelOpened)} />
      </AppShell.Header>
      <AppShell.Navbar>
        {sidebarOpened && <Sidebar opened={sidebarOpened} onToggle={() => setSidebarOpened(!sidebarOpened)} />}
      </AppShell.Navbar>
      <AppShell.Aside>
        {propertiesPanelOpened && selectedElement && <PropertiesPanel opened={propertiesPanelOpened} onToggle={() => setPropertiesPanelOpened(!propertiesPanelOpened)} selectedElement={selectedElement} />}
      </AppShell.Aside>
      <AppShell.Main>
        <Canvas onElementSelect={handleElementSelect} selectedElement={selectedElement} />
      </AppShell.Main>
    </AppShell>;
};

export default CanvaEditor;