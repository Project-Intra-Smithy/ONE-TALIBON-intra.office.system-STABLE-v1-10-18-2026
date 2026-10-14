/* Development entry dependency only; never imported by production components. */
export async function isolatePreview() {
    if (!import.meta.env.DEV || !['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)) {
        throw new Error('Synthetic preview requires the local Vite development server.');
    }
    const nativeFetch = window.fetch.bind(window);
    if (navigator.serviceWorker?.controller) throw new Error('Preview requires an uncontrolled development page.');
    const handshake = await nativeFetch('/__dashboard-preview/ready', { credentials: 'omit' });
    if (!handshake.ok || (await handshake.json()).preview !== 'synthetic-dashboard-only') {
        throw new Error('Preview isolation middleware is unavailable. Dashboard was not mounted.');
    }
    // Inertia keeps its real page URL in state for active navigation, but this
    // fixture must remain reloadable at the isolated HTML entry and chosen role.
    const previewUrl = location.href;
    const replaceState = history.replaceState.bind(history);
    history.replaceState = (data, unused) => replaceState(data, unused, previewUrl);
    // Inertia's initial canonical URL must not create a duplicate fixture entry.
    // Full-document fixture links alone own navigation and browser back/forward.
    history.pushState = (data, unused) => replaceState(data, unused, previewUrl);
    window.fetch = (input, options) => {
        const request = input instanceof Request ? new Request(input, options) : new Request(new URL(input.toString(), location.href), options);
        const url = new URL(request.url);
        if (url.origin !== location.origin || request.method !== 'GET' ||
            !(/^\/tasks(?:\/\d+)?$/.test(url.pathname) || url.pathname === '/notifications/feed')) {
            return Promise.reject(new Error('Network request blocked by synthetic preview'));
        }
        // Use a dedicated fixture namespace, NEVER a protected Laravel endpoint.
        url.pathname = '/__dashboard-preview' + url.pathname;
        return nativeFetch(url, { method: 'GET', credentials: 'omit', signal: options?.signal ?? (input instanceof Request ? input.signal : undefined) });
    };
    // Inertia visits/writes and all other XHR are unavailable in this preview.
    XMLHttpRequest.prototype.open = function () { throw new Error('XHR blocked by synthetic preview'); };
    navigator.sendBeacon = () => false;
    const unavailable = () => {
        const status = document.getElementById('preview-status');
        if (status) status.textContent = 'Preview only. This action is available in the authenticated workspace. No request was sent.';
    };
    document.addEventListener('inertia:before', event => { event.preventDefault(); unavailable(); });
    document.addEventListener('submit', event => { event.preventDefault(); event.stopImmediatePropagation(); unavailable(); }, true);
    const screens: Record<string, string> = {
        '/dashboard': 'dashboard', '/transactions': 'work', '/correspondence': 'correspondence',
        '/records': 'records', '/memoranda': 'memoranda', '/calendar': 'calendar',
        '/employees': 'employees', '/departments': 'departments', '/login': 'login',
        '/security/mfa/challenge': 'mfa',
    };
    document.addEventListener('click', event => {
        const link = (event.target as Element).closest?.('a');
        if (!link) return;
        const target = new URL(link.href, location.href);
        // Only existing index screens have fixture destinations. Filters, detail
        // records and mutations remain unavailable, never simulated as successful.
        if (target.origin === location.origin && screens[target.pathname] && !target.search && !target.hash) {
            event.preventDefault(); event.stopImmediatePropagation();
            const params = new URLSearchParams(location.search);
            params.set('screen', screens[target.pathname]);
            location.assign('/visual-preview.html?' + params.toString());
            return;
        }
        const allowed = target.origin === location.origin && target.pathname === '/visual-preview.html';
        if (!allowed && !link.getAttribute('href')?.startsWith('#')) {
            event.preventDefault(); event.stopImmediatePropagation();
            unavailable();
        }
    }, true);
}
