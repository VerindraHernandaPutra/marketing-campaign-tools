// 'import React from 'react';' dihapus karena tidak lagi diperlukan
import { MantineProvider } from '@mantine/core';
import CanvaEditor from './components/CanvaEditor';
import { CanvasProvider } from './components/Layout/CanvasContext';
import '@mantine/core/styles.css';

export function App() {
  return (
    <MantineProvider theme={{}}>
      <CanvasProvider>
        <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
          <CanvaEditor />
        </div>
      </CanvasProvider>
    </MantineProvider>
  );
}