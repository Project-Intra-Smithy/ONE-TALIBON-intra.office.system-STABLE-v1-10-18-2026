/* Test-only entry: synthetic props/transport, never part of the Laravel entry. */
import '../../../../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import AppLayout from '../../../layouts/AppLayout';
import PageFrame from '../../PageFrame';
import { fixturePage } from '../../../visual-fixtures';

const params = new URLSearchParams(location.search);
const fixture = fixturePage('records');
if (params.has('denied')) fixture.props.permissions = { navigation: {}, reports: false };
fixture.props.flash = params.has('error') ? { error: 'The request could not be saved. Please try again.' } : { success: 'Your changes have been saved.' };
function ShellFixture() {
    return <AppLayout title="Records and office documents"><PageFrame>
        <header><h1 className="text-2xl font-bold">Workspace layout preview</h1><p>Synthetic content for shell checks. No Laravel session.</p></header>
        <section className="municipal-panel p-5 space-y-4" aria-labelledby="documents-title">
            <h2 id="documents-title" className="municipal-panel-title">Office documents</h2>
            <p>Find documents using the search above or open a workspace from the navigation.</p>
            <label className="block">Reference number<input className="block w-full border p-2 rounded-lg mt-2" placeholder="Enter a reference number" /></label>
            <button type="button" className="municipal-action">Check reference</button>
        </section>
        <section className="municipal-panel p-5 space-y-3" aria-labelledby="updates-title">
            <h2 id="updates-title" className="municipal-panel-title">Recent updates</h2>
            <ul className="divide-y"><li className="py-3">Sample office document received</li><li className="py-3">Sample reference updated</li></ul>
        </section>
    </PageFrame></AppLayout>;
}
document.getElementById('app')!.dataset.page = JSON.stringify({ component: 'ShellFixture', props: { ...fixture.props, errors: {} }, url: '/records', version: null });
createInertiaApp({
    id: 'app',
    page: { component: 'ShellFixture', props: { ...fixture.props, errors: {} }, url: '/records', version: null, rescuedProps: [], flash: {}, rememberedState: {} },
    resolve: () => ShellFixture,
    setup({ el, App, props }) { createRoot(el).render(<App {...props} />); },
});
