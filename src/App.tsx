// 'import React from 'react';' dihapus karena tidak lagi diperlukan
import { MantineProvider } from '@mantine/core';
import CanvaEditor from './components/CanvaEditor';
import '@mantine/core/styles.css';

export function App() {
  // Semua logika useState dan useColorScheme telah dihapus
  // MantineProvider akan menangani mode gelap/terang secara otomatis
  return <MantineProvider theme={{}}>
      <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
        <CanvaEditor />
      </div>
    </MantineProvider>;
}