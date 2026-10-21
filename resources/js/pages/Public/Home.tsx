import '../../../css/public-homepage-refinement.css';
import { Head } from '@inertiajs/react';
import PublicFooter from '../../components/public/PublicFooter';
import PublicHero from '../../components/public/PublicHero';
import PublicMunicipalHomepage from '../../components/public/PublicMunicipalHomepage';
import type { PublicContent } from '../../components/public/types';

type Props = { appName: string; authenticated: boolean; content: PublicContent };

export default function Home({ authenticated, content }: Props) {
    return <>
        <Head title="ONE TALIBON - Intra-Office Portal" />
        <div className="public-portal public-refined" id="top">
            <a href="#public-content" className="skip-link">Skip to main content</a>
            <PublicHero content={content} authenticated={authenticated} />
            <main id="public-content" tabIndex={-1}>
                <PublicMunicipalHomepage content={content} authenticated={authenticated} />
            </main>
            <PublicFooter content={content} authenticated={authenticated} />
        </div>
    </>;
}
