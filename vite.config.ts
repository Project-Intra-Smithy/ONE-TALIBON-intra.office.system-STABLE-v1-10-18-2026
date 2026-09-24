import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:8000';
const appOrigin = (() => {
    try {
        return new URL(appUrl).origin;
    } catch {
        return 'http://127.0.0.1:8000';
    }
})();
const hmrHost = process.env.VITE_HMR_HOST ?? new URL(appOrigin).hostname;
const vitePort = Number(process.env.VITE_PORT ?? 5173);

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            hotFile: 'storage/framework/vite.hot',
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        host: process.env.VITE_DEV_HOST ?? '0.0.0.0',
        port: vitePort,
        strictPort: true,
        hmr: {
            host: hmrHost,
            port: vitePort,
        },
        cors: {
            origin: appOrigin,
        },
    },
});
