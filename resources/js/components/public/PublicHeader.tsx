import { Link } from '@inertiajs/react';
import { LogIn, Menu, Sun, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppearanceControl from '../AppearanceControl';
import MunicipalBrand from '../MunicipalBrand';

type Props = { authenticated: boolean };

export const publicLinks = [
    ['Overview', '#home'],
    ['Everyday', '#everyday'],
    ['Capabilities', '#capabilities'],
    ['Workflow', '#workflow'],
    ['Security', '#secure-access'],
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
        <div className="mx-auto flex min-h-[72px] w-full max-w-[1360px] items-center gap-3 px-[var(--public-page-gutter)] py-2.5 lg:gap-5">
            <a href="#home" aria-label="ONE TALIBON · LGU Intra-Office Portal home" className="public-brand min-w-0 flex-1 lg:flex-none">
                <MunicipalBrand />
                <span className="hidden min-w-0 border-l pl-4 xl:grid [border-color:var(--public-divider)]">
                    <strong className="text-[10px] font-extrabold uppercase tracking-[0.14em] [color:var(--public-link)]">Internal Workspace</strong>
                    <span className="mt-0.5 text-[11px] font-medium [color:var(--public-muted)]">Municipality of Talibon, Bohol</span>
                </span>
            </a>

            <nav aria-label="LGU Intra-Office Portal navigation" className="ml-auto hidden items-stretch gap-1 lg:flex">
                {publicLinks.map(([label, href]) => <a key={href} href={href} className="public-nav-link px-2.5">
                    {label}
                </a>)}
            </nav>

            <div className="public-header-actions">
                <details ref={appearanceMenu} className="public-appearance-menu hidden lg:block">
                    <summary className="public-appearance-trigger" title="Appearance settings">
                        <Sun size={16} aria-hidden="true" />
                        <span className="sr-only">Appearance settings</span>
                    </summary>
                    <div className="public-appearance-panel">
                        <p className="public-appearance-label">Appearance</p>
                        <AppearanceControl publicSurface />
                    </div>
                </details>

                <Link href={authenticated ? '/dashboard' : '/login'} className="public-login-link">
                    <LogIn size={16} aria-hidden="true" />
                    <span>{authenticated ? 'Portal' : 'Login'}</span>
                </Link>

                <button
                    ref={trigger}
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="public-menu-button lg:hidden"
                    aria-label={open ? 'Close portal navigation' : 'Open portal navigation'}
                    aria-expanded={open}
                    aria-controls="public-mobile-navigation"
                >
                    {open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
                </button>
            </div>
        </div>

        <nav
            id="public-mobile-navigation"
            aria-label="Mobile LGU Intra-Office Portal navigation"
            className={`${open ? 'block' : 'hidden'} public-navigation lg:hidden`}
        >
            <div className="public-nav-inner">
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
                <p className="public-mobile-appearance-label">Appearance</p>
                <AppearanceControl publicSurface />
            </div>
        </nav>
    </header>;
}
