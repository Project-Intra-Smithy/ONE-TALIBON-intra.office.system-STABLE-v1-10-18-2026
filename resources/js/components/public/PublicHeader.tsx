import { Link } from '@inertiajs/react';
import { LogIn, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import MunicipalBrand from '../MunicipalBrand';

type Props = { authenticated: boolean };

export const publicLinks = [
    ['Home', '#home'],
    ['Capabilities', '#capabilities'],
    ['About the Portal', '#about-portal'],
    ['Help / Support', '#support'],
] as const;

export default function PublicHeader({ authenticated }: Props) {
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const escape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || !open) return;

            setOpen(false);
            trigger.current?.focus();
        };

        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [open]);

    return <header className="public-header sticky top-0 z-50">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1360px] items-center gap-2 px-[var(--public-page-gutter)] py-1.5 2xl:gap-4">
            <a
                href="#home"
                aria-label="ONE TALIBON · Talibon Intra-Office Portal home"
                className="public-brand min-w-0 flex-1 2xl:flex-none"
                style={{ gap: '12px' }}
            >
                <MunicipalBrand />
                <span className="hidden min-w-0 border-l pl-3 2xl:grid [border-color:var(--public-divider)]">
                    <strong className="text-[9px] font-extrabold uppercase tracking-[0.13em] [color:var(--public-link)]">Internal Workspace</strong>
                    <span className="text-[10px] font-medium leading-4 [color:var(--public-muted)]">Municipality of Talibon, Bohol</span>
                </span>
            </a>

            <nav aria-label="Talibon Intra-Office Portal navigation" className="ml-auto hidden items-center gap-5 xl:flex">
                {publicLinks.map(([label, href]) => <a key={href} href={href} className="public-nav-link">
                    {label}
                </a>)}
            </nav>

            <div className="public-header-actions">
                <Link
                    href={authenticated ? '/dashboard' : '/login'}
                    className="public-login-link"
                    style={{ minHeight: '44px', paddingInline: '12px' }}
                >
                    <LogIn size={15} aria-hidden="true" />
                    <span>{authenticated ? 'Portal' : 'Employee Login'}</span>
                </Link>

                <button
                    ref={trigger}
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="public-menu-button xl:hidden"
                    style={{ width: '44px', minHeight: '44px' }}
                    aria-label={open ? 'Close portal navigation' : 'Open portal navigation'}
                    aria-expanded={open}
                    aria-controls="public-mobile-navigation"
                >
                    {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
                </button>
            </div>
        </div>

        <nav
            id="public-mobile-navigation"
            aria-label="Mobile Talibon Intra-Office Portal navigation"
            className={`${open ? 'block' : 'hidden'} public-navigation xl:hidden`}
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
        </nav>
    </header>;
}
