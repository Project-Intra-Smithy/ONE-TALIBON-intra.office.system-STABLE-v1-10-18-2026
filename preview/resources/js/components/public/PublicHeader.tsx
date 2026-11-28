import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { talibonAssets } from '../../branding/talibonAssets';

type Props = { authenticated: boolean };
export const publicLinks = [
    ['Home', '#home'], ['Capabilities', '#capabilities'],
    ['About the Portal', '#about-portal'], ['Help / Support', '#support'],
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
    const navigate = (href: string) => {
        setOpen(false);
        // Move focus out of the collapsing disclosure to the selected section.
        document.getElementById(href.slice(1))?.focus({ preventScroll: true });
    };
    return <div className="wrap public-header">
        <div className="nav">
            <a className="brand" href="#home" aria-label="ONE TALIBON home">
                <img src={talibonAssets.municipalSeal} alt="" width="40" height="40" />
                <span><span className="brand-name">ONE TALIBON</span><span className="brand-sub">Talibon Intra-Office Portal</span></span>
            </a>
            <nav className="nav-links" aria-label="Primary">
                {publicLinks.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
            </nav>
            <div className="nav-actions">
                <Link href={authenticated ? '/dashboard' : '/login'} className="btn btn-light btn-sm public-login-link">
                    {authenticated ? 'Portal' : 'Employee Login'}
                </Link>
                <button ref={trigger} type="button" onClick={() => setOpen(!open)} className="menu-button"
                    aria-label={open ? 'Close portal navigation' : 'Open portal navigation'}
                    aria-expanded={open} aria-controls="public-mobile-navigation">
                    {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
                </button>
            </div>
        </div>
        <nav id="public-mobile-navigation" className="mobile-navigation" hidden={!open} aria-label="Mobile portal navigation">
            {publicLinks.map(([label, href]) => <a key={href} href={href} onClick={() => navigate(href)}>{label}</a>)}
        </nav>
    </div>;
}
