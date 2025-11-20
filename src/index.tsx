import React from 'react';
import './index.css';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './AppRouter';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { AuthProvider } from './auth/AuthProvider';
import { MantineProvider } from '@mantine/core';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <MantineProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </MantineProvider>
  </React.StrictMode>
);