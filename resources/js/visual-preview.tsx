/* Development-only Vite entry. Not included in the Laravel production build input. */
import '../css/app.css';
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { fixturePage, previewScreens } from './visual-fixtures';
import { isolatePreview } from './components/dashboard/preview-isolation';
import { dashboardRoles, dashboardRoleLabels } from './components/dashboard/preview-fixtures';
import './components/dashboard/preview.css';

try {
    await isolatePreview();
} catch (error) {
    const message = document.getElementById('visual-fixture-label');
    if (message) {
        message.setAttribute('role', 'alert');
        message.textContent = 'Preview unavailable. Open this HTML preview from the local Vite server with its isolation middleware enabled.';
    }
    throw error;
}

const params = new URLSearchParams(window.location.search);
const screen = params.get('screen') ?? 'dashboard';
const role = params.get('role') ?? 'employee';
const page = fixturePage(screen, role, params.get('state') ?? 'populated');
const root = document.getElementById('app');
const label = document.getElementById('visual-fixture-label');
if (!root || !label) throw new Error('Visual fixture mount missing');

root.dataset.page = JSON.stringify({ component: page.component, props: page.props, url: page.url, version: null });
label.className = 'fixture-banner';
label.replaceChildren();
const title = document.createElement('strong');
title.textContent = 'VISUAL FIXTURE';
const note = document.createElement('span');
note.textContent = 'FRONTEND DRAFT — PENDING BACKEND WIRING, AUTHENTICATED TESTING & RELEASE APPROVAL. Synthetic data; backend actions unavailable.';
label.append(title, note);
const controls = document.createElement('nav');
controls.setAttribute('aria-label', 'Preview screens');
for (const item of previewScreens) {
    const link = document.createElement('a');
    link.href = '/visual-preview.html?' + new URLSearchParams({ screen: item.key, role }).toString();
    link.textContent = item.label;
    if (item.key === screen) link.setAttribute('aria-current', 'page');
    controls.append(link);
}
label.append(controls);
if (screen === 'dashboard') {
    const roleLabel = document.createElement('label');
    roleLabel.textContent = 'Workspace';
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Workspace');
    for (const key of dashboardRoles) {
        const option = document.createElement('option');
        option.value = key; option.textContent = dashboardRoleLabels[key]; select.append(option);
    }
    select.value = dashboardRoles.includes(role as typeof dashboardRoles[number]) ? role : 'employee';
    select.addEventListener('change', () => {
        params.set('role', select.value);
        location.href = '/visual-preview.html?' + params.toString();
    });
    roleLabel.append(select); label.append(roleLabel);
}
const status = document.createElement('p');
status.id = 'preview-status'; status.setAttribute('role', 'status');
label.append(status);
createInertiaApp({
    id: 'app',
    page: { component: page.component, props: { ...page.props, errors: {} }, url: page.url, version: null, rescuedProps: [], flash: {}, rememberedState: {} },
    title: (title) => title ? `${title} · Visual fixture` : 'ONE TALIBON · Visual fixture',
    resolve: (name) => resolvePageComponent<ResolvedComponent>(`./pages/${name}.tsx`, import.meta.glob<ResolvedComponent>('./pages/**/*.tsx')),
    setup({ el, App, props }) { createRoot(el).render(<App {...props} />); },
});
