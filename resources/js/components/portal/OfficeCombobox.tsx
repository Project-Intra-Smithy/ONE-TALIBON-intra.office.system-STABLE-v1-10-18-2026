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
        <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Receiving Office</label>
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
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
        <p id={`${id}-help`} className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{selected ? `Selected: ${selected.name}` : 'Choose an authorized receiving office.'}</p>
        {error && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
        {open && <div className="absolute z-30 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-900">
            <ul ref={list} id={`${id}-list`} role="listbox" aria-label="Receiving offices" className="max-h-72 overflow-y-auto p-1">
                {matches.map(office => <li key={office.id} id={`${id}-${office.id}`} role="option" aria-selected={value === office.id}
                    data-office-id={office.id} onMouseDown={event => event.preventDefault()} onClick={() => choose(office)}
                    className={`min-h-11 cursor-pointer rounded-md px-3 py-3 text-base leading-6 ${activeOffice?.id === office.id ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-50' : 'text-slate-800 dark:text-slate-100'}`}>
                    <span className="block break-words font-semibold">{office.name}{value === office.id ? ' ✓' : ''}</span>
                    <span className="block text-sm">{office.branch === 'legislative' ? 'Legislative Branch' : 'Executive / Administrative'}</span>
                </li>)}
            </ul>
            <p role="status" className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">{matches.length ? `${matches.length} offices. Use arrow keys and Enter to select.` : 'No matching offices. Try another name.'}</p>
        </div>}
    </div>;
}
