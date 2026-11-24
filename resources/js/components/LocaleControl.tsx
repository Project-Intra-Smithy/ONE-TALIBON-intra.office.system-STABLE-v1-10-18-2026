import { Globe } from 'lucide-react';
import { LOCALE_OPTIONS, useLocale } from '../lib/i18n';

export default function LocaleControl({ compact = false }: { compact?: boolean }) {
    const { locale, setLocale, t } = useLocale();

    if (compact) {
        const currentIndex = LOCALE_OPTIONS.findIndex((opt) => opt.value === locale);
        const nextOption = LOCALE_OPTIONS[(currentIndex + 1) % LOCALE_OPTIONS.length];
        const current = LOCALE_OPTIONS[currentIndex] ?? LOCALE_OPTIONS[0];
        return (
            <button
                type="button"
                onClick={() => setLocale(nextOption.value)}
                aria-label={`${t('languageLabel')}: ${current.label}. Switch to ${nextOption.label}`}
                title={`${t('languageLabel')}: ${current.label}`}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] text-xs font-bold text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-[var(--focus-ring-sidebar)]"
            >
                {current.short}
            </button>
        );
    }

    return (
        <div
            role="group"
            aria-label={t('languageLabel')}
            className="flex min-w-0 items-center justify-between gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-2 py-1"
        >
            <span className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] font-medium text-[var(--surface-sidebar-muted)]">
                <Globe size={13} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{t('languageLabel')}</span>
            </span>
            <div className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-black/25 p-0.5">
                {LOCALE_OPTIONS.map((opt) => {
                    const active = locale === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            aria-pressed={active}
                            title={opt.label}
                            onClick={() => setLocale(opt.value)}
                            className={`min-h-7 rounded px-1.5 text-[11px] font-bold transition-colors focus-visible:outline-[var(--focus-ring-sidebar)] ${
                                active
                                    ? 'bg-[var(--brand-primary)] text-white'
                                    : 'text-[var(--surface-sidebar-muted)] hover:text-white'
                            }`}
                        >
                            {opt.short}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
