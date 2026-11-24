import { Check, ChevronDown, Monitor, Moon, Sun } from 'lucide-react';
import { useId, useRef } from 'react';
import type { AppearancePreference } from '../theme/appearance';
import { useAppearance } from '../theme/useAppearance';

type Props = {
    publicSurface?: boolean;
    compact?: boolean;
};

export default function AppearanceControl({ publicSurface = false, compact = false }: Props) {
    const { appearance, systemScheme, choose } = useAppearance();
    const popoverRef = useRef<HTMLDivElement>(null);
    const popoverId = useId();
    const anchorName = `--tcds-appearance-${popoverId.replace(/:/g, '')}`;

    const systemResolvedLabel = systemScheme === 'dark' ? 'dark' : 'light';
    const choices: Array<{ value: AppearancePreference; label: string; description: string; icon: typeof Monitor }> = [
        { value: 'system', label: 'System', description: `Currently ${systemResolvedLabel}`, icon: Monitor },
        { value: 'light', label: 'Light', description: 'Warm stone light mode', icon: Sun },
        { value: 'dark', label: 'Dark', description: 'Obsidian pine dark mode', icon: Moon },
    ];

    const selected = choices.find((choice) => choice.value === appearance) ?? choices[0];
    const SelectedIcon = selected.icon;
    const triggerStatusText = appearance === 'system' ? `System (${systemScheme === 'dark' ? 'Dark' : 'Light'})` : selected.label;

    if (publicSurface) {
        return (
            <div
                className="grid grid-cols-3 gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-1"
                role="group"
                aria-label="Appearance preference"
            >
                {choices.map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => choose(value)}
                        aria-pressed={appearance === value}
                        className={`flex min-h-11 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors ${
                            appearance === value
                                ? 'bg-[var(--brand-primary)] text-white'
                                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                        }`}
                    >
                        <Icon size={15} aria-hidden="true" />
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="min-w-0">
            <button
                type="button"
                popoverTarget={popoverId}
                style={{ anchorName } as React.CSSProperties}
                aria-label={`Appearance: ${triggerStatusText}. Choose theme`}
                title={compact ? `Appearance: ${triggerStatusText}` : undefined}
                className={`flex min-h-11 items-center rounded-lg border border-white/15 bg-white/[0.06] text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-[var(--focus-ring-sidebar)] ${
                    compact ? 'w-11 justify-center' : 'w-full gap-2.5 px-3'
                }`}
            >
                <SelectedIcon size={17} aria-hidden="true" />
                {!compact && (
                    <>
                        <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                            Appearance <span className="text-[var(--surface-sidebar-muted)]">· {triggerStatusText}</span>
                        </span>
                        <ChevronDown size={15} aria-hidden="true" className="shrink-0" />
                    </>
                )}
            </button>

            <div
                ref={popoverRef}
                id={popoverId}
                popover="auto"
                data-placement="top-start"
                style={{ positionAnchor: anchorName } as React.CSSProperties}
                role="group"
                aria-label="Appearance preference"
                className="tcds-popover w-60 p-1.5"
            >
                <div className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                    Appearance
                </div>
                {choices.map(({ value, label, description, icon: Icon }) => {
                    const active = appearance === value;
                    return (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                                choose(value);
                                popoverRef.current?.hidePopover?.();
                            }}
                            className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                                active
                                    ? 'bg-[var(--brand-soft)] text-[var(--ink-primary)]'
                                    : 'text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]'
                            }`}
                        >
                            <Icon
                                size={17}
                                aria-hidden="true"
                                className={`shrink-0 ${active ? 'text-[var(--brand-ink)]' : 'text-[var(--ink-secondary)]'}`}
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold">{label}</span>
                                <span className="block text-xs text-[var(--ink-secondary)]">{description}</span>
                            </span>
                            {active && <Check size={16} aria-hidden="true" className="shrink-0 text-[var(--brand-ink)]" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
