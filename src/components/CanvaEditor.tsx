import React, { useState } from 'react';
import { AppShell, useMantineTheme } from '@mantine/core';
import { fabric } from 'fabric';
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import FabricCanvas from './Layout/FabricCanvas';
import PropertiesPanel from './Layout/PropertiesPanel';

const CanvaEditor: React.FC = () => {
  const theme = useMantineTheme();
  const [sidebarOpened, setSidebarOpened] = useState(true);
  const [propertiesPanelOpened, setPropertiesPanelOpened] = useState(true);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);

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
      collapsed: { mobile: true, desktop: !propertiesPanelOpened || !activeObject }
    }} 
    header={{
      height: 60
    }}
  >
      <AppShell.Header>
        <Header sidebarOpened={sidebarOpened} onToggleSidebar={() => setSidebarOpened(!sidebarOpened)} propertiesPanelOpened={propertiesPanelOpened} onTogglePropertiesPanel={() => setPropertiesPanelOpened(!propertiesPanelOpened)} />
      </AppShell.Header>
      <AppShell.Navbar>
        {sidebarOpened && <Sidebar opened={sidebarOpened} onToggle={() => setSidebarOpened(!sidebarOpened)} canvas={canvas} />}
      </AppShell.Navbar>
      <AppShell.Aside>
        {propertiesPanelOpened && activeObject && <PropertiesPanel
          opened={propertiesPanelOpened}
          onToggle={() => setPropertiesPanelOpened(!propertiesPanelOpened)}
          activeObject={activeObject}
          canvas={canvas} />}
      </AppShell.Aside>
      <AppShell.Main>
        <FabricCanvas setCanvas={setCanvas} setActiveObject={setActiveObject} />
      </AppShell.Main>
    </AppShell>;
};

export default CanvaEditor;