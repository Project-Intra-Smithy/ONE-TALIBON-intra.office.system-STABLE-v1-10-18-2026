import { Link } from '@inertiajs/react';
import { LogIn, Menu, Sun, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppearanceControl from '../AppearanceControl';
import MunicipalBrand from '../MunicipalBrand';

type Props = { authenticated: boolean };

export const publicLinks = [
    ['Services', '#services'],
    ['Updates', '#news'],
    ['Transparency', '#transparency'],
    ['About', '#about'],
    ['Portal', '#secure-access'],
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

    return <header className="public-header sticky top-0 z-50">
        <div className="mx-auto flex min-h-[68px] w-full max-w-[1360px] items-center gap-2 px-[var(--public-page-gutter)] py-1.5 2xl:gap-4">
            <a
                href="#home"
                aria-label="ONE TALIBON Municipal Public Portal home"
                className="public-brand min-w-0 flex-1 2xl:flex-none"
                style={{ gap: '12px' }}
            >
                <MunicipalBrand publicPortal />
                <span className="hidden min-w-0 border-l pl-3 2xl:grid [border-color:var(--public-divider)]">
                    <strong className="text-[9px] font-extrabold uppercase tracking-[0.13em] [color:var(--public-link)]">Official municipal gateway</strong>
                    <span className="text-[10px] font-medium leading-4 [color:var(--public-muted)]">Municipality of Talibon, Bohol</span>
                </span>
            </a>

            <nav aria-label="Municipal Public Portal navigation" className="ml-auto hidden items-center gap-5 2xl:flex">
                {publicLinks.map(([label, href]) => <a key={href} href={href} className="public-nav-link">
                    {label}
                </a>)}
            </nav>

            <div className="public-header-actions">
                <details ref={appearanceMenu} className="public-appearance-menu hidden 2xl:block">
                    <summary className="public-appearance-trigger" title="Appearance settings">
                        <Sun size={16} aria-hidden="true" />
                        <span className="sr-only">Appearance settings</span>
                    </summary>
                    <div className="public-appearance-panel">
                        <p className="public-appearance-label">Appearance</p>
                        <AppearanceControl publicSurface />
                    </div>
                </details>

                <Link
                    href={authenticated ? '/dashboard' : '/login'}
                    className="public-login-link"
                    style={{ minHeight: '44px', paddingInline: '12px' }}
                >
                    <LogIn size={15} aria-hidden="true" />
                    <span>{authenticated ? 'Open Portal' : 'Employee Login'}</span>
                </Link>

                <button
                    ref={trigger}
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="public-menu-button 2xl:hidden"
                    style={{ width: '44px', minHeight: '44px' }}
                    aria-label={open ? 'Close public navigation' : 'Open public navigation'}
                    aria-expanded={open}
                    aria-controls="public-mobile-navigation"
                >
                    {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
                </button>
            </div>
        </div>

        <nav
            id="public-mobile-navigation"
            aria-label="Mobile Municipal Public Portal navigation"
            className={`${open ? 'block' : 'hidden'} public-navigation 2xl:hidden`}
        >
            <div className="mx-auto flex w-full max-w-[1360px] flex-col px-[var(--public-page-gutter)] py-1.5">
                {publicLinks.map(([label, href]) => <a
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="public-nav-link px-1"
                >
                    {label}
                </a>)}
            </div>
            <div className="public-mobile-appearance">
                <p className="public-mobile-appearance-label">Appearance</p>
                <AppearanceControl publicSurface />
            </div>
        </nav>
    </header>;
}
