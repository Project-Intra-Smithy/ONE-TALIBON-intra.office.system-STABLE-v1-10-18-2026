import AppLayout from '../layouts/AppLayout';
import PageFrame from './PageFrame';

/** Missing server props are unavailable data, never an empty municipal register. */
export default function WorkspaceUnavailable({ title }: { title: string }) {
    return <AppLayout title={title}>
        <PageFrame>
            <section role="status" className="municipal-panel p-6 sm:p-8">
                <h1 className="text-2xl font-bold">{title} unavailable</h1>
                <p className="mt-3 text-base">The server did not provide the data needed for this page. Retry to request it again.</p>
                <button type="button" onClick={() => window.location.reload()} className="municipal-action mt-5">Retry</button>
            </section>
        </PageFrame>
    </AppLayout>;
}
