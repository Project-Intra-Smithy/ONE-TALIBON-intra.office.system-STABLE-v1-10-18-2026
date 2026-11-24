import { Link, router } from '@inertiajs/react';
import { Grid3X3, Search, X } from 'lucide-react';
import { type FormEvent, useId } from 'react';
import { useLocale } from '../../lib/i18n';
import { getUserInitials } from '../../lib/userIdentity';
import type { PortalNavigationGroup } from '../../navigation/portalNavigation';
import type { AuthUser } from '../../types';

export function RecordsSearch({ onOpenCommandPalette }: { onOpenCommandPalette?: () => void }) {
    const inputId = useId();
    const { t } = useLocale();

    function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get('/records', { search: String(data.get('search') || '').trim() });
    }

    return (
        <search>
            <form onSubmit={handleSearch} className="flex items-center gap-1.5" aria-label="Search municipal records">
                <div className="relative flex-1">
                    <label htmlFor={inputId} className="sr-only">
                        Search municipal records
                    </label>
                    <Search
                        size={16}
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]"
                    />
                    <input
                        id={inputId}
                        type="search"
                        name="search"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder={t('searchRecordsPlaceholder')}
                        className={`h-10 w-full rounded-lg border border-[var(--border-control)] bg-[var(--surface-input)] pl-9 text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-tertiary)] focus:bg-[var(--surface-card)] ${
                            onOpenCommandPalette ? 'pr-16' : 'pr-3'
                        }`}
                    />
                    {onOpenCommandPalette && (
                        <button
                            type="button"
                            onClick={onOpenCommandPalette}
                            aria-label="Open Quick Jump command palette (Ctrl+K)"
                            title="Quick Jump (Ctrl+K)"
                            className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center rounded border border-[var(--border-default)] bg-[var(--surface-card)] px-1.5 py-0.5 font-mono text-xs font-semibold text-[var(--ink-secondary)] transition-colors hover:border-[var(--brand-ink)] hover:text-[var(--ink-primary)] lg:inline-flex"
                        >
                            Ctrl K
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-2.5 text-xs font-semibold text-[var(--ink-primary)] transition-colors hover:bg-[var(--surface-hover)] xl:px-3 xl:text-sm"
                >
                    {t('searchButton')}
                </button>
            </form>
        </search>
    );
}

export function PortalLauncher({ groups }: { groups: PortalNavigationGroup[] }) {
    const popoverId = useId();
    const items = groups.flatMap((group) => group.items);

    return (
        <>
            <button
                type="button"
                popoverTarget={popoverId}
                style={{ anchorName: '--tcds-launcher-anchor' } as React.CSSProperties}
                aria-label="Open portal applications"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--ink-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
            >
                <Grid3X3 size={19} aria-hidden="true" />
            </button>
            <nav
                id={popoverId}
                popover="auto"
                data-placement="bottom-end"
                style={{ positionAnchor: '--tcds-launcher-anchor' } as React.CSSProperties}
                aria-label="Portal applications"
                className="tcds-popover w-80 p-3.5"
            >
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-[var(--border-default)] pb-2">
                    <span className="text-sm font-bold text-[var(--ink-primary)]">Portal applications</span>
                    <button
                        type="button"
                        popoverTarget={popoverId}
                        popoverTargetAction="hide"
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]"
                        aria-label="Close portal applications"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {items.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3 py-2 text-sm font-semibold text-[var(--ink-primary)] transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
                        >
                            <Icon size={16} aria-hidden="true" className="shrink-0 text-[var(--brand-ink)]" />
                            <span className="truncate">{label}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </>
    );
}

export function PortalIdentity({ user }: { user: AuthUser | null }) {
    if (!user) return null;
    const initials = getUserInitials(user.name);
    const dept = user.employee?.department?.short_name || user.employee?.department?.name;

    return (
        <div
            title={`${user.name}${dept ? ` · ${dept}` : ''}`}
            aria-label={`${user.name}${dept ? `, ${dept}` : ''}`}
            className="flex min-w-0 items-center gap-2 border-l border-[var(--border-default)] pl-2.5 xl:pl-3"
        >
            <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] text-xs font-bold text-[var(--brand-ink)]"
            >
                {initials}
            </span>
            <div className="hidden min-w-0 max-w-40 xl:block">
                <div className="truncate text-sm font-semibold leading-tight text-[var(--ink-primary)]">{user.name}</div>
                {dept && <div className="truncate text-xs text-[var(--ink-secondary)]">{dept}</div>}
            </div>
        </div>
    );
}
