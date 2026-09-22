import { Head } from '@inertiajs/react';
import { Info } from 'lucide-react';
import PublicFooter from '../../components/public/PublicFooter';
import PublicHeader from '../../components/public/PublicHeader';
import PublicHero from '../../components/public/PublicHero';
import PublicQuickAccess from '../../components/public/PublicQuickAccess';
import PublicServices from '../../components/public/PublicServices';
import type { PublicContent } from '../../components/public/types';

type Props = { appName: string; authenticated: boolean; content: PublicContent };

export default function Home({ authenticated, content }: Props) {
    return <>
        <Head title="ONE TALIBON — LGU Intra-Office Portal" />
        <div className="public-portal min-h-screen">
            <a href="#public-content" className="public-skip-link">Skip to main content</a>
            <PublicHeader authenticated={authenticated} content={content} />
            <main id="public-content" tabIndex={-1}>
                <PublicHero content={content} />
                <div className="public-disclosure">
                    <Info size={14} aria-hidden="true" />
                    <p>{content.sampleLabel}: this pre-login overview uses sample content for interface evaluation and does not represent an official municipal publication.</p>
                </div>
                <PublicServices content={content} />
                <PublicQuickAccess content={content} />
            </main>
            <PublicFooter content={content} authenticated={authenticated} />
        </div>
    </>;
}
