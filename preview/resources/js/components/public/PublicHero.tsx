import { Link } from '@inertiajs/react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import PublicHeader from './PublicHeader';
import type { PublicContent } from './types';

type Props = { content: PublicContent; authenticated: boolean };

export default function PublicHero({ content, authenticated }: Props) {
    return <header id="home" tabIndex={-1} className="hero" aria-labelledby="public-hero-title">
        <img className="hero-img" src="/images/municipality/talibon-homepage-hero.jpg" alt="Talibon Municipal Hall, front entrance with Philippine flags" width="1280" height="640" fetchPriority="high" />
        <PublicHeader authenticated={authenticated} />
        <div className="hero-body wrap">
            <p className="label">{content.hero.eyebrow}</p>
            <h1 id="public-hero-title">{content.hero.title === 'ONE TALIBON. ONE WORKSPACE.' ? 'One Talibon. One workspace.' : content.hero.title}</h1>
            <p className="hero-lede">{content.hero.lead === 'MUNICIPAL WORK, CONNECTED ACROSS OFFICES.' ? 'Municipal work, connected across offices.' : content.hero.lead} {content.hero.description}</p>
            <div className="hero-actions">
                <Link href={authenticated ? '/dashboard' : '/login'} className="btn btn-light">
                    {authenticated ? 'Open Employee Portal' : 'Employee Login'} <ArrowRight className="icon" aria-hidden="true" />
                </Link>
                <a href="#about-portal" className="btn btn-ghost">About the Portal</a>
            </div>
        </div>
        <div className="hero-note"><div className="wrap">
            <ShieldCheck className="icon" aria-hidden="true" />
            <p>Authorized municipal personnel only. Protected operational records remain inside authenticated access.</p>
        </div></div>
    </header>;
}
