/* Development-only Vite entry. Not included in the Laravel production build input. */
import '../css/app.css';
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { fixturePage, previewScreens } from './visual-fixtures';

const params = new URLSearchParams(window.location.search);
const screen = params.get('screen') ?? 'dashboard';
const role = params.get('role') ?? 'employee';
const page = fixturePage(screen, role);
const root = document.getElementById('app');
const label = document.getElementById('visual-fixture-label');
if (!root || !label) throw new Error('Visual fixture mount missing');

root.dataset.page = JSON.stringify({ component: page.component, props: page.props, url: page.url, version: null });
label.className = 'fixture-banner';
label.innerHTML = `<strong>VISUAL FIXTURE</strong><span>Synthetic content · no Laravel session</span><nav aria-label="Preview screens">${previewScreens.map(({ key, label: name }) => `<a href="/visual-preview.html?screen=${encodeURIComponent(key)}${key === 'dashboard' ? `&role=${encodeURIComponent(role)}` : ''}" ${key === screen ? 'aria-current="page"' : ''}>${name}</a>`).join('')}</nav>`;

createInertiaApp({
    id: 'app',
    page: { component: page.component, props: { ...page.props, errors: {} }, url: page.url, version: null, rescuedProps: [], flash: {}, rememberedState: {} },
    title: (title) => title ? `${title} · Visual fixture` : 'ONE TALIBON · Visual fixture',
    resolve: (name) => resolvePageComponent<ResolvedComponent>(`./pages/${name}.tsx`, import.meta.glob<ResolvedComponent>('./pages/**/*.tsx')),
    setup({ el, App, props }) { createRoot(el).render(<App {...props} />); },
});
