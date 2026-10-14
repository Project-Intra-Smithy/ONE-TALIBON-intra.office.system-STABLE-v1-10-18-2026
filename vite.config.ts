import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { dashboardPreviewPlugin } from './tests/fixtures/dashboard-preview-plugin.ts';

export default defineConfig({
    // Concurrent browser suites must not invalidate each other's dependency cache.
    cacheDir: process.env.FRONTEND_TEST_CACHE_DIR || 'node_modules/.vite',
    plugins: [
        dashboardPreviewPlugin(),
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        host: '0.0.0.0',
        // Evidence files must not trigger HMR while mounted checks are running.
        watch: { ignored: ['**/artifacts/**'] },
    },
});
