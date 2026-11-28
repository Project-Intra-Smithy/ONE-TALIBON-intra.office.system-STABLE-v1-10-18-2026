import { Layers } from 'lucide-react';
type Toggle={label:string;checked:boolean;onChange?:()=>void;color?:string};
export default function MapExplorerControls({overlays,categories,unavailableReason}:{overlays:Toggle[];categories:Toggle[];unavailableReason?:string}) {
    return <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink-primary)]"><Layers size={16} aria-hidden="true" />Map Layers & Overlays</h2>
        <div className="mt-3 space-y-2">{overlays.map(toggle=><label key={toggle.label} className="flex min-h-11 items-center gap-2.5 text-sm font-medium text-[var(--ink-primary)]"><input type="checkbox" checked={toggle.checked} disabled={!toggle.onChange} onChange={toggle.onChange} className="h-4 w-4 accent-[var(--brand-ink)]" /><span>{toggle.label}</span></label>)}</div>
        {unavailableReason&&<p className="mt-2 text-xs leading-5 text-[var(--ink-secondary)]">{unavailableReason}</p>}
        <div className="mt-3"><h3 className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Map Pins by Category</h3><div className="mt-2 flex flex-wrap gap-1.5">{categories.map(toggle=><button key={toggle.label} type="button" aria-pressed={toggle.checked} disabled={!toggle.onChange} onClick={toggle.onChange} className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${toggle.checked?'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--ink-primary)]':'border-[var(--border-default)] bg-[var(--surface-recessed)] text-[var(--ink-secondary)]'}`}>{toggle.color&&<span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor:toggle.color}} aria-hidden="true" />}<span>{toggle.label}</span></button>)}</div></div>
    </div>;
}
