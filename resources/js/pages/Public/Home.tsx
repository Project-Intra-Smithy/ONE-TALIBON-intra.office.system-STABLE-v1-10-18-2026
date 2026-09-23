import { Head } from '@inertiajs/react';
import { Info } from 'lucide-react';
import PublicCapabilities from '../../components/public/PublicCapabilities';
import PublicFooter from '../../components/public/PublicFooter';
import PublicHeader from '../../components/public/PublicHeader';
import PublicHero from '../../components/public/PublicHero';
import PublicOfficeOverview from '../../components/public/PublicOfficeOverview';
import PublicSecureAccess from '../../components/public/PublicSecureAccess';
import PublicWorkflow from '../../components/public/PublicWorkflow';
import type { PublicContent } from '../../components/public/types';

type Props = { appName: string; authenticated: boolean; content: PublicContent };

export default function Home({ authenticated, content }: Props) {
    return <>
        <Head title="ONE TALIBON — LGU Intra-Office Portal" />
        <div className="public-portal min-h-screen">
            <a href="#public-content" className="public-skip-link sr-only z-[80] rounded bg-white p-3 text-blue-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
            <PublicHeader authenticated={authenticated} />
            <main id="public-content" tabIndex={-1}>
                <div className="public-content">
                    <div className="public-disclosure">
                        <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <p>Prototype preview — sample portal overview content is shown for evaluation and does not represent live municipal operational data.</p>
                    </div>
                    <div className="public-primary">
                        <PublicHero content={content} />
                        <PublicCapabilities content={content} />
                        <div className="public-information-zone">
                            <PublicWorkflow content={content} />
                            <PublicOfficeOverview content={content} />
                            <PublicSecureAccess content={content} authenticated={authenticated} />
                        </div>
                    </div>
                </div>
            </main>
            <PublicFooter content={content} authenticated={authenticated} />
        </div>
    </>;
}
