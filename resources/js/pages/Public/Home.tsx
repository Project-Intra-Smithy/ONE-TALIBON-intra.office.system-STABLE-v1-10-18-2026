import { Head } from '@inertiajs/react';
import { Info } from 'lucide-react';
import PublicAbout from '../../components/public/PublicAbout';
import PublicCapabilities from '../../components/public/PublicCapabilities';
import PublicDailyConvenience from '../../components/public/PublicDailyConvenience';
import PublicFooter from '../../components/public/PublicFooter';
import PublicHeader from '../../components/public/PublicHeader';
import PublicHero from '../../components/public/PublicHero';
import PublicOfficeOverview from '../../components/public/PublicOfficeOverview';
import PublicSecureAccess from '../../components/public/PublicSecureAccess';
import PublicWorkflow from '../../components/public/PublicWorkflow';
import { PUBLIC_CONTENT_FRAME_CLASS } from '../../components/public/publicLayout';
import type { PublicContent } from '../../components/public/types';

type Props = { appName: string; authenticated: boolean; content: PublicContent };

export default function Home({ authenticated, content }: Props) {
    return <>
        <Head title="ONE TALIBON — LGU Intra-Office Portal" />
        <div className="public-portal min-h-screen">
            <a href="#public-content" className="public-skip-link sr-only z-[80] rounded bg-white p-3 text-blue-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
            <PublicHeader authenticated={authenticated} />
            <main id="public-content" tabIndex={-1}>
                <div className="public-content" style={{ paddingBottom: 0 }}>
                    <div className={`${PUBLIC_CONTENT_FRAME_CLASS} public-disclosure`}>
                        <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <p>
                            <strong className="mr-2 font-extrabold uppercase tracking-[0.08em] [color:var(--public-text)]">{content.sampleLabel}</strong>
                            <span>Prototype portal preview for evaluation. No live municipal operational data shown.</span>
                        </p>
                    </div>
                    <div className="public-primary">
                        <PublicHero content={content} authenticated={authenticated} />
                        <PublicAbout content={content} />
                        <PublicDailyConvenience content={content} />
                        <PublicCapabilities content={content} />
                        <PublicWorkflow content={content} />
                        <PublicOfficeOverview content={content} />
                        <PublicSecureAccess content={content} authenticated={authenticated} />
                    </div>
                </div>
            </main>
            <PublicFooter content={content} authenticated={authenticated} />
        </div>
    </>;
}
