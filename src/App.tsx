import { MantineProvider } from '@mantine/core';
import CanvaEditor from './components/CanvaEditor';
// 1. FIX: Remove the incorrect provider
// import { CanvasProvider } from './components/Layout/CanvasContext'; 
import '@mantine/core/styles.css';

export function App() {
  return (
    <MantineProvider theme={{}}>
      {/* 2. FIX: Remove the incorrect provider wrapper */}
      {/* <CanvasProvider> */}
        <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
          <CanvaEditor />
        </div>
      {/* </CanvasProvider> */}
    </MantineProvider>
  );
}