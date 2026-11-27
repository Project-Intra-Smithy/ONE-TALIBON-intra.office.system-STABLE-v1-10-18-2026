import { useEffect, useId, useRef, useState } from 'react';

type Office = { id: number; name: string; short_name?: string | null; branch: string };
type Props = { offices: Office[]; value: number | ''; onChange: (id: number) => void; error?: string; disabled?: boolean };

/** Search is local; only a supplied authorized office can become the submitted ID. */
export default function OfficeCombobox({ offices, value, onChange, error, disabled }: Props) {
    const id = useId();
    const input = useRef<HTMLInputElement>(null);
    const list = useRef<HTMLUListElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const selected = offices.find(office => office.id === value);
    const matches = offices.filter(office => `${office.name} ${office.short_name ?? ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
    const activeOffice = matches[Math.min(active, matches.length - 1)];
    const close = () => { setOpen(false); setQuery(''); setActive(0); };
    const choose = (office: Office) => { onChange(office.id); close(); input.current?.focus(); };
    useEffect(() => {
        if (open && activeOffice) list.current?.querySelector(`[data-office-id="${activeOffice.id}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [open, activeOffice?.id]);
    return <div className="relative min-w-0" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
        <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[var(--ink-secondary)]">Receiving Office</label>
        <input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={open}
            aria-controls={`${id}-list`} aria-activedescendant={open && activeOffice ? `${id}-${activeOffice.id}` : undefined}
            aria-invalid={Boolean(error)} aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
            disabled={disabled} required={!selected} autoComplete="off"
            value={open ? query : selected?.name ?? ''} placeholder="Type an office name"
            onClick={() => setOpen(true)} onFocus={() => setOpen(true)}
            onChange={event => { setQuery(event.target.value); setActive(0); setOpen(true); }}
            onKeyDown={event => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault(); setOpen(true);
                    setActive(current => !open ? 0 : Math.max(0, Math.min(matches.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))));
                } else if (event.key === 'Enter' && open) {
                    event.preventDefault(); if (activeOffice) choose(activeOffice);
                } else if (event.key === 'Escape') { event.preventDefault(); close(); }
            }}
            className="tcds-input text-sm" />
        <p id={`${id}-help`} className="mt-1.5 text-xs leading-5 text-[var(--ink-secondary)]">{selected ? `Selected: ${selected.name}` : 'Choose an authorized receiving office.'}</p>
        {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-[var(--status-danger-fg)]">{error}</p>}
        {open && <div className="absolute z-30 mt-2 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xl">
            <ul ref={list} id={`${id}-list`} role="listbox" aria-label="Receiving offices" className="max-h-72 overflow-y-auto p-1">
                {matches.map(office => <li key={office.id} id={`${id}-${office.id}`} role="option" aria-selected={value === office.id}
                    data-office-id={office.id} onMouseDown={event => event.preventDefault()} onClick={() => choose(office)}
                    className={`min-h-11 cursor-pointer rounded-md px-3 py-2.5 text-sm leading-5 ${activeOffice?.id === office.id ? 'bg-[var(--brand-soft)] text-[var(--brand-ink)]' : 'text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]'}`}>
                    <span className="block break-words font-semibold">{office.name}{value === office.id ? ' ✓' : ''}</span>
                    <span className="block text-xs text-[var(--ink-secondary)]">{office.branch === 'legislative' ? 'Legislative Branch' : 'Executive / Administrative'}</span>
                </li>)}
            </ul>
            <p role="status" className="border-t border-[var(--border-default)] px-3.5 py-2.5 text-xs text-[var(--ink-secondary)]">{matches.length ? `${matches.length} ${matches.length === 1 ? 'office' : 'offices'}. Use arrow keys and Enter to select.` : 'No matching offices. Try another name.'}</p>
        </div>}
    </div>;
}
