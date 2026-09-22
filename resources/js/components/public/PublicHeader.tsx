import { Link } from '@inertiajs/react';
import { Building2, ChevronRight, Menu, Search, Sun, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { talibonAssets } from '../../branding/talibonAssets';
import AppearanceControl from '../AppearanceControl';
import type { PublicContent } from './types';

type Props = { authenticated: boolean; content: PublicContent };

export default function PublicHeader({ authenticated, content }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    const searchInput = useRef<HTMLInputElement>(null);
    const suppressSearchFocusOpen = useRef(false);
    const appearanceMenu = useRef<HTMLDetailsElement>(null);

    const searchable = useMemo(() => [
        ...content.features.map(feature => ({ title: feature.title, description: feature.description, href: feature.href ?? `#${feature.id}` })),
        ...content.services.map(service => ({ title: service.title, description: service.description, href: service.href ?? '#services' })),
        ...content.news.map(item => ({ title: item.title, description: item.summary, href: '#news' })),
        ...content.transparency.map(item => ({ title: item.label, description: item.note, href: '#transparency' })),
        ...content.quickAccess.filter(item => item.href).map(item => ({ title: item.label, description: 'Quick access', href: item.href as string })),
    ], [content]);

    const results = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return [];
        return searchable.filter(item => `${item.title} ${item.description}`.toLowerCase().includes(normalized)).slice(0, 8);
    }, [query, searchable]);

    useEffect(() => {
        const escape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            if (open) {
                setOpen(false);
                trigger.current?.focus();
            }
            if (searchOpen) {
                setSearchOpen(false);
                setQuery('');
                suppressSearchFocusOpen.current = true;
                searchInput.current?.focus();
                queueMicrotask(() => {
                    suppressSearchFocusOpen.current = false;
                });
            }
            if (appearanceMenu.current?.open) {
                appearanceMenu.current.open = false;
                const summary = appearanceMenu.current.querySelector('summary');
                if (summary instanceof HTMLElement) summary.focus();
            }
        };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [open, searchOpen]);

    return <header className="public-header">
        <div className="public-government-bar">
            <div className="public-government-inner">
                <div className="public-government-left">
                    <span>{content.government.republic}</span>
                    <span className="public-government-divider" aria-hidden="true">|</span>
                    <span>{content.government.province}</span>
                </div>
                <strong className="public-surface-badge">{content.government.surfaceLabel}</strong>
            </div>
        </div>

        <div className="public-masthead">
            <a href="#home" className="public-municipal-identity" aria-label="ONE TALIBON · LGU Intra-Office Portal home">
                <img src={talibonAssets.municipalSeal} alt="" className="public-seal" />
                <div>
                    <span className="public-masthead-eyebrow">{content.masthead.eyebrow}</span>
                    <span className="public-masthead-title">{content.masthead.title}</span>
                    <span className="public-masthead-subtitle">{content.masthead.subtitle}</span>
                </div>
            </a>

            <div className="public-search-wrap">
                    <Search size={18} aria-hidden="true" />
                    <label htmlFor="public-search" className="sr-only">Search portal overview</label>
                    <input
                        ref={searchInput}
                        id="public-search"
                        type="search"
                        value={query}
                        placeholder="Search portal overview"
                        onFocus={() => {
                            if (!suppressSearchFocusOpen.current) setSearchOpen(true);
                        }}
                        onChange={event => {
                            setQuery(event.target.value);
                            setSearchOpen(true);
                        }}
                        aria-expanded={searchOpen}
                        aria-controls="public-search-results"
                        autoComplete="off"
                    />
                    {searchOpen && <div id="public-search-results" className="public-search-results" role="region" aria-label="Portal overview search results">
                        {query.trim() === '' ? <p>Search the current portal overview and municipal information.</p> :
                            results.length ? <ul>{results.map(result => <li key={`${result.href}-${result.title}`}>
                                <a href={result.href} onClick={() => { setSearchOpen(false); setQuery(''); }}>
                                    <span>{result.title}</span>
                                    <ChevronRight size={15} aria-hidden="true" />
                                </a>
                            </li>)}</ul> : <p>No matching portal overview content found.</p>}
                    </div>}
            </div>

            <div className="public-masthead-tools">
                <details ref={appearanceMenu} className="public-appearance-menu">
                    <summary className="public-appearance-trigger" title="Appearance settings">
                        <Sun size={17} aria-hidden="true" />
                        <span className="sr-only">Appearance settings</span>
                    </summary>
                    <div className="public-appearance-panel">
                        <p className="public-appearance-label">Appearance</p>
                        <AppearanceControl publicSurface />
                    </div>
                </details>

                <button
                    ref={trigger}
                    type="button"
                    className="public-menu-button"
                    onClick={() => setOpen(current => !current)}
                    aria-expanded={open}
                    aria-controls="public-navigation"
                    aria-label={open ? 'Close portal navigation' : 'Open portal navigation'}
                >
                    {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
                </button>
            </div>
        </div>

        <nav id="public-navigation" className={`public-navigation ${open ? 'is-open' : ''}`} aria-label="LGU Intra-Office Portal navigation">
            <div className="public-nav-inner">
                {content.navigation.map(item => <a
                    key={item.label}
                    href={item.href}
                    className="public-nav-link"
                    onClick={() => setOpen(false)}
                >
                    {item.label}
                </a>)}
                <Link href={authenticated ? '/dashboard' : '/login'} className="public-employee-link">
                    <Building2 size={16} aria-hidden="true" />
                    {authenticated ? 'Portal' : 'Login'}
                </Link>
            </div>
        </nav>
    </header>;
}
