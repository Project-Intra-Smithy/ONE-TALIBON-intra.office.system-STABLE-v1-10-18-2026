import { BellRing, CalendarDays, Info, MapPin } from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
import { PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { NewsItem, PublicContent } from './types';

function AdvisoryItem({ item }: { item: NewsItem }) {
    return <article className="public-reference-advisory-item">
        <div className="public-reference-advisory-title">
            <BellRing size={14} aria-hidden="true" />
            <strong>{item.title}</strong>
        </div>
        <p>{item.summary}</p>
        <span>{item.date || 'Prototype preview — no active warning is issued here.'}</span>
    </article>;
}

function EventItem({ item }: { item: NewsItem }) {
    return <article className="public-reference-event-item">
        <span className="public-reference-event-date">
            <CalendarDays size={16} aria-hidden="true" />
        </span>
        <div>
            <strong>{item.title}</strong>
            <p>{item.summary}</p>
            <span>{item.date || 'Schedule not yet published'}</span>
        </div>
    </article>;
}

export default function PublicSideRail({ content }: { content: PublicContent }) {
    const advisories = content.news.filter(item => item.type.toLowerCase() === 'advisory');
    const events = content.news.filter(item => item.type.toLowerCase() === 'event');

    return <aside className="public-reference-side" aria-label="Municipal advisories, events and Talibon information">
        <section className="public-reference-side-panel public-reference-advisories" aria-labelledby="public-advisories-title">
            <header>
                <BellRing size={16} aria-hidden="true" />
                <h2 id="public-advisories-title">MDRRMO Advisories</h2>
            </header>
            <div className="public-reference-side-body">
                {advisories.length
                    ? advisories.map(item => <AdvisoryItem key={item.title} item={item} />)
                    : <p className="public-reference-empty">No advisory preview available.</p>}
                <p className="public-reference-panel-note"><Info size={12} aria-hidden="true" /> Prototype presentation only.</p>
            </div>
        </section>

        <section id="news" style={PUBLIC_SECTION_ANCHOR_STYLE} className="public-reference-side-panel" aria-labelledby="public-events-title">
            <header>
                <CalendarDays size={16} aria-hidden="true" />
                <h2 id="public-events-title">Upcoming Events</h2>
            </header>
            <div className="public-reference-side-body public-reference-event-list">
                {events.length
                    ? events.map(item => <EventItem key={item.title} item={item} />)
                    : <p className="public-reference-empty">No event preview available.</p>}
            </div>
        </section>

        <section id="about" style={PUBLIC_SECTION_ANCHOR_STYLE} className="public-reference-promo" aria-labelledby="public-about-title">
            <img src={talibonAssets.publicPromoImage} alt="Talibon, Bohol municipal landscape" />
            <div className="public-reference-promo-overlay" aria-hidden="true" />
            <div className="public-reference-promo-copy">
                <p>ONE TALIBON</p>
                <h2 id="public-about-title">Municipality of Talibon, Bohol</h2>
                <span><MapPin size={12} aria-hidden="true" /> Northern Bohol · Municipal digital portal</span>
            </div>
        </section>
    </aside>;
}
