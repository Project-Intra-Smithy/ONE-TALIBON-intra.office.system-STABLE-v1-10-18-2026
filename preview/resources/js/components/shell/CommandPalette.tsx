import { router } from '@inertiajs/react';
import { ArrowRight, Globe, Map as MapIcon, Moon, Plus, Search, Sun } from 'lucide-react';
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { loadPlanningMaps } from '../../data/municipal/planningMaps';
import { LOCALE_OPTIONS, useLocale } from '../../lib/i18n';
import type { PortalNavigationGroup } from '../../navigation/portalNavigation';
import { useAppearance } from '../../theme/useAppearance';
import { Dialog } from '../ui';

type CommandItem = {
    id: string;
    group: 'workspaces' | 'maps' | 'actions';
    label: string;
    subtitle?: string;
    keywords?: string;
    icon: typeof Search;
    run: () => void;
};

type Props = {
    open: boolean;
    onClose: () => void;
    navigationGroups: PortalNavigationGroup[];
};

export default function CommandPalette({ open, onClose, navigationGroups }: Props) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const { resolved, choose } = useAppearance();
    const { locale, setLocale, t } = useLocale();

    useEffect(() => {
        if (open) {
            setQuery('');
            setActiveIndex(0);
            window.requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    const items = useMemo<CommandItem[]>(() => {
        const workspaceItems: CommandItem[] = navigationGroups.flatMap((group) =>
            group.items.map((item) => ({
                id: `nav-${item.key}`,
                group: 'workspaces' as const,
                label: item.label,
                subtitle: group.label,
                keywords: `${item.label} ${group.label} ${item.href}`,
                icon: item.icon,
                run: () => {
                    onClose();
                    router.get(item.href);
                },
            })),
        );

        const publishedMaps = loadPlanningMaps()
            .filter((m) => m.status === 'published')
            .slice(0, 6)
            .map<CommandItem>((m) => ({
                id: `map-${m.id}`,
                group: 'maps',
                label: `${m.code} · ${m.title}`,
                subtitle: m.barangays.slice(0, 3).join(', '),
                keywords: `${m.code} ${m.title} ${m.barangays.join(' ')} planning map gis clup drrm`,
                icon: MapIcon,
                run: () => {
                    onClose();
                    router.get('/planning-maps');
                },
            }));

        const nextLocale = LOCALE_OPTIONS[(LOCALE_OPTIONS.findIndex((o) => o.value === locale) + 1) % LOCALE_OPTIONS.length];
        const nextTheme = resolved === 'dark' ? 'light' : 'dark';

        const actionItems: CommandItem[] = [
            {
                id: 'act-new-wr',
                group: 'actions',
                label: t('newWorkRequest'),
                subtitle: 'Route accountable work to an LGU office',
                keywords: 'create new work request transaction route',
                icon: Plus,
                run: () => {
                    onClose();
                    router.get('/transactions/create');
                },
            },
            {
                id: 'act-theme',
                group: 'actions',
                label: resolved === 'dark' ? 'Switch to Warm Stone Light Mode' : 'Switch to Obsidian Pine Dark Mode',
                subtitle: `Current: ${resolved === 'dark' ? 'Dark' : 'Light'}`,
                keywords: 'theme appearance dark light mode obsidian',
                icon: resolved === 'dark' ? Sun : Moon,
                run: () => {
                    choose(nextTheme);
                    onClose();
                },
            },
            {
                id: 'act-locale',
                group: 'actions',
                label: `Switch language to ${nextLocale.label} (${nextLocale.short})`,
                subtitle: 'English · Cebuano · Filipino',
                keywords: 'language locale cebuano bisaya filipino english i18n',
                icon: Globe,
                run: () => {
                    setLocale(nextLocale.value);
                    onClose();
                },
            },
        ];

        return [...workspaceItems, ...publishedMaps, ...actionItems];
    }, [navigationGroups, resolved, choose, locale, setLocale, onClose, t]);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return items.slice(0, 12);
        return items.filter(
            (item) =>
                item.label.toLowerCase().includes(needle) ||
                (item.subtitle?.toLowerCase().includes(needle) ?? false) ||
                (item.keywords?.toLowerCase().includes(needle) ?? false),
        );
    }, [items, query]);

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    const runSearchFallback = () => {
        const trimmed = query.trim();
        onClose();
        router.get('/records', trimmed ? { search: trimmed } : {});
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (filtered.length > 0) setActiveIndex((i) => (i + 1) % filtered.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (filtered.length > 0) setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (filtered[activeIndex]) {
                filtered[activeIndex].run();
            } else {
                runSearchFallback();
            }
        }
    };

    const sections: Array<{ key: CommandItem['group']; heading: string; list: CommandItem[] }> = [
        { key: 'workspaces' as const, heading: t('quickJumpWorkspaces'), list: filtered.filter((i) => i.group === 'workspaces') },
        { key: 'maps' as const, heading: t('quickJumpMaps'), list: filtered.filter((i) => i.group === 'maps') },
        { key: 'actions' as const, heading: t('quickJumpActions'), list: filtered.filter((i) => i.group === 'actions') },
    ].filter((s) => s.list.length > 0);

    return (
        <Dialog open={open} onClose={onClose} title={t('quickJumpTitle')} hideHeader>
            <div className="-mx-5 -my-4 flex flex-col">
                <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] px-4 py-3">
                    <Search size={18} aria-hidden="true" className="shrink-0 text-[var(--brand-ink)]" />
                    <input
                        ref={inputRef}
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        aria-label={t('quickJumpTitle')}
                        placeholder={t('quickJumpPlaceholder')}
                        className="min-h-10 w-full bg-transparent text-sm font-medium text-[var(--ink-primary)] outline-none placeholder:text-[var(--ink-tertiary)]"
                    />
                    <kbd className="hidden rounded border border-[var(--border-control)] bg-[var(--surface-recessed)] px-1.5 py-0.5 font-mono text-xs font-semibold text-[var(--ink-secondary)] sm:inline">
                        Esc
                    </kbd>
                </div>

                <div className="max-h-[54dvh] overflow-y-auto p-2">
                    {sections.length === 0 ? (
                        <div className="space-y-3 px-3 py-6 text-center">
                            <p className="text-sm text-[var(--ink-secondary)]">{t('quickJumpEmpty')}</p>
                            <button type="button" onClick={runSearchFallback} className="municipal-primary-button">
                                <Search size={15} aria-hidden="true" />
                                <span>Search records for “{query.trim()}”</span>
                            </button>
                        </div>
                    ) : (
                        sections.map((section) => (
                            <div key={section.key} className="mb-2 last:mb-0">
                                <div className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                                    {section.heading}
                                </div>
                                <ul className="space-y-0.5">
                                    {section.list.map((item) => {
                                        const flatIdx = filtered.indexOf(item);
                                        const active = flatIdx === activeIndex;
                                        const Icon = item.icon;
                                        return (
                                            <li key={item.id}>
                                                <button
                                                    type="button"
                                                    onMouseEnter={() => setActiveIndex(flatIdx)}
                                                    onClick={item.run}
                                                    className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                                                        active
                                                            ? 'bg-[var(--brand-soft)] text-[var(--ink-primary)]'
                                                            : 'text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]'
                                                    }`}
                                                >
                                                    <span
                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                                                            active
                                                                ? 'border-[var(--brand-soft-border)] bg-[var(--surface-card)] text-[var(--brand-ink)]'
                                                                : 'border-[var(--border-default)] bg-[var(--surface-recessed)] text-[var(--ink-secondary)]'
                                                        }`}
                                                    >
                                                        <Icon size={15} aria-hidden="true" />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-semibold">{item.label}</span>
                                                        {item.subtitle && (
                                                            <span className="block truncate text-xs text-[var(--ink-secondary)]">
                                                                {item.subtitle}
                                                            </span>
                                                        )}
                                                    </span>
                                                    {active && <ArrowRight size={14} aria-hidden="true" className="shrink-0 text-[var(--brand-ink)]" />}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-2 text-xs text-[var(--ink-secondary)]">
                    <span>{t('quickJumpHint')}</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-semibold text-[var(--ink-primary)] hover:underline"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Dialog>
    );
}
