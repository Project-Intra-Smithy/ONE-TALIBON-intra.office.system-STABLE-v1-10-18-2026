/** Installed before fixture adapters: unmatched requests never reach an operational server. */
export function installPreviewNetworkBoundary() {
    window.fetch = async () => new Response(JSON.stringify({
        message: 'Preview only. This action is not connected and no municipal record was saved.',
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    document.addEventListener('submit', (event) => event.preventDefault(), true);
}
