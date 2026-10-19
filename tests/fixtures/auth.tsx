/* Mounted transport regression harness. Playwright intercepts every auth request. */
import '../../resources/css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import Login from '../../resources/js/pages/Auth/Login';

if (!import.meta.env.DEV) throw new Error('Test harness requires development mode');
createInertiaApp({
    page: { component: 'Auth/Login', props: { errors: {} }, url: '/login', version: null, rescuedProps: [], flash: {}, rememberedState: {} },
    resolve: () => Login,
    setup({ el, App, props }) { createRoot(el).render(<App {...props} />); },
});
