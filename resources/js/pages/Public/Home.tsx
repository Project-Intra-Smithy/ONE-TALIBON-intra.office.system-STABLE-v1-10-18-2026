import '../../../css/public-homepage-lane5.css';
import { Head } from '@inertiajs/react';
import { Info } from 'lucide-react';
import PublicFooter from '../../components/public/PublicFooter';
import PublicHeader from '../../components/public/PublicHeader';
import PublicMunicipalHomepage from '../../components/public/PublicMunicipalHomepage';
import { PUBLIC_CONTENT_FRAME_CLASS } from '../../components/public/publicLayout';
import type { PublicContent } from '../../components/public/types';

type Props = { appName: string; authenticated: boolean; content: PublicContent };

export default function Home({ authenticated, content }: Props) {
    return <>
        <Head title="ONE TALIBON — Municipal Digital Portal" />
        <div className="public-portal min-h-screen">
            <a href="#public-content" className="public-skip-link sr-only z-[80] rounded bg-white p-3 [color:var(--public-link)] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
            <PublicHeader authenticated={authenticated} />

            <main id="public-content" tabIndex={-1}>
                <div className="public-content public-reference-content">
                    <div className={`${PUBLIC_CONTENT_FRAME_CLASS} public-disclosure public-reference-disclosure`}>
                        <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <p>
                            <strong className="mr-2 font-extrabold uppercase tracking-[0.08em] [color:var(--public-text)]">{content.sampleLabel}</strong>
                            <span>This evaluation homepage keeps prototype-only information clearly labeled and exposes no protected employee records.</span>
                        </p>
                    </div>

                    <PublicMunicipalHomepage content={content} authenticated={authenticated} />
                </div>
            </main>

            <PublicFooter content={content} authenticated={authenticated} />
        </div>
    </>;
}
