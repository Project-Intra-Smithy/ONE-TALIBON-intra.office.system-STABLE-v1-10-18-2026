import { Link } from '@inertiajs/react';
import { Home, LogIn, Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppearanceControl from '../AppearanceControl';
import MunicipalBrand from '../MunicipalBrand';

type Props = { authenticated: boolean };

export const publicLinks = [
    ['Home', '#home'],
    ['About the Portal', '#about-portal'],
    ['Help / Support', '#support'],
] as const;

export default function PublicHeader({ authenticated }: Props) {
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    const appearanceMenu = useRef<HTMLDetailsElement>(null);

    useEffect(() => {
        const escape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;

            if (open) {
                setOpen(false);
                trigger.current?.focus();
            }

            if (appearanceMenu.current?.open) {
                appearanceMenu.current.open = false;
                const summary = appearanceMenu.current.querySelector('summary');
                if (summary instanceof HTMLElement) summary.focus();
            }
        };

        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [open]);

    return <header className="public-header public-reference-header">
        <div className="public-reference-masthead">
            <a href="#home" aria-label="ONE TALIBON Intra-Office Portal home" className="public-reference-brand">
                <MunicipalBrand publicPortal />
                <span className="public-reference-brand-meta">
                    <strong>Municipality of Talibon, Bohol</strong>
                    <span>Secure municipal operations gateway</span>
                </span>
            </a>

            <div className="public-reference-masthead-actions">
                <div className="public-reference-tagline">
                    <span>Authorized municipal personnel</span>
                    <strong>Internal operations portal</strong>
                </div>

                <details ref={appearanceMenu} className="public-appearance-menu public-reference-appearance">
                    <summary className="public-appearance-trigger" title="Appearance settings">
                        <Sun size={16} aria-hidden="true" />
                        <span>Appearance</span>
                    </summary>
                    <div className="public-appearance-panel">
                        <p className="public-appearance-label">Appearance</p>
                        <AppearanceControl publicSurface />
                    </div>
                </details>

                <Link href={authenticated ? '/dashboard' : '/login'} className="public-login-link public-reference-login">
                    <LogIn size={15} aria-hidden="true" />
                    <span>{authenticated ? 'Open Portal' : 'Employee Login'}</span>
                </Link>

                <button
                    ref={trigger}
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="public-menu-button public-reference-menu"
                    aria-label={open ? 'Close portal navigation' : 'Open portal navigation'}
                    aria-expanded={open}
                    aria-controls="public-mobile-navigation"
                >
                    {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
                </button>
            </div>
        </div>

        <nav className="public-reference-nav" aria-label="Intra-Office Portal navigation">
            <div className="public-reference-nav-inner">
                {publicLinks.map(([label, href], index) => <a key={href} href={href} className={`public-reference-nav-link ${index === 0 ? 'is-home' : ''}`}>
                    {index === 0 && <Home size={14} aria-hidden="true" />}
                    {label}
                </a>)}
            </div>
        </nav>

        <nav
            id="public-mobile-navigation"
            aria-label="Mobile Intra-Office Portal navigation"
            className={`${open ? 'block' : 'hidden'} public-navigation public-reference-mobile-nav xl:hidden`}
        >
            <div className="public-reference-mobile-links">
                {publicLinks.map(([label, href]) => <a
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="public-nav-link"
                >
                    {label}
                </a>)}
            </div>
            <div className="public-mobile-appearance">
                <p className="public-mobile-appearance-label"><Moon size={14} aria-hidden="true" /> Appearance</p>
                <AppearanceControl publicSurface />
            </div>
        </nav>
    </header>;
}
