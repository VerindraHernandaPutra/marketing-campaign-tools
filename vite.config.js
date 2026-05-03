import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // React core — cached long-term, rarely changes
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    // Mantine UI — large, stable
                    'vendor-mantine': ['@mantine/core', '@mantine/hooks'],
                    // Charts — only used in Analytics/Dashboard
                    'vendor-charts': ['recharts'],
                    // Canvas editor — heaviest, only used in /editor
                    'vendor-fabric': ['fabric'],
                    // Supabase client
                    'vendor-supabase': ['@supabase/supabase-js'],
                    // Query layer
                    'vendor-query': ['@tanstack/react-query'],
                },
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './test/setup.ts',
    },
});
