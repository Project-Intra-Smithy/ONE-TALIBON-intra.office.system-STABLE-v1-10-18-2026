import type { ReactNode } from 'react';
import { Eye, MapPin, Pencil } from 'lucide-react';
import { StatusBadge } from '../ui';

type Props = {
    code: string; title: string; description: string; category: string; status: string;
    imageUrl?: string; effectivePeriod?: string; updatedLabel?: string; selected?: boolean;
    onInspect: () => void; onLocate: () => void; onEdit?: () => void; managementActions?: ReactNode;
};

export default function MapGalleryCard(props: Props) {
    return <article className={`tcds-card flex min-w-0 flex-col overflow-hidden transition-colors ${props.selected ? 'border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]' : 'hover:border-[var(--border-strong)]'}`}>
        <button type="button" onClick={props.onInspect} aria-label={`Inspect full map plate for ${props.title}`} className="group relative block h-44 w-full overflow-hidden border-b border-[var(--border-default)] bg-[var(--surface-recessed)] p-2 text-left">
            {props.imageUrl ? <img src={props.imageUrl} alt={`${props.title} (${props.code})`} loading="lazy" className="tcds-plate-thumb h-full w-full rounded-lg border border-[var(--border-default)] object-cover transition-transform duration-200 group-hover:scale-[1.02]" /> : <span className="flex h-full items-center justify-center rounded-lg border border-dashed border-[var(--border-control)] px-4 pt-6 text-center text-xs text-[var(--ink-secondary)]">Official map image unavailable. Open the provisional reference plate and record metadata.</span>}
            <span className="absolute left-3.5 top-3.5 max-w-[calc(100%-1.75rem)] break-words rounded-md bg-[var(--surface-sidebar)] px-2 py-0.5 font-mono text-xs font-bold text-white">{props.code}</span>
        </button>
        <div className="flex flex-1 flex-col p-4">
            <div className="flex flex-wrap gap-1.5"><StatusBadge tone={/published/i.test(props.status) ? 'ok' : /draft|review/i.test(props.status) ? 'warn' : 'neutral'}>{props.status}</StatusBadge><StatusBadge tone="info">{props.category}</StatusBadge></div>
            <h3 className="mt-2 break-words text-base font-bold leading-snug text-[var(--ink-primary)]">{props.title}</h3>
            <p className="mt-1 line-clamp-2 flex-1 text-xs leading-5 text-[var(--ink-secondary)]">{props.description}</p>
            <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-[var(--border-default)] pt-2.5 text-xs text-[var(--ink-secondary)]"><span>{props.effectivePeriod ?? 'Effective period not supplied'}</span><span>{props.updatedLabel ?? 'Update date not supplied'}</span></div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={props.onInspect} className="municipal-primary-button flex-1"><Eye size={15} aria-hidden="true" />View Plate</button>
                <button type="button" onClick={props.onLocate} className="municipal-secondary-button px-3" aria-label={`Locate ${props.title} on interactive map`}><MapPin size={15} aria-hidden="true" /></button>
                {props.onEdit && <button type="button" onClick={props.onEdit} className="municipal-secondary-button px-3" aria-label={`Edit ${props.title}`}><Pencil size={15} aria-hidden="true" />Edit</button>}
            </div>
            {props.managementActions && <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-[var(--border-default)] pt-1.5">{props.managementActions}</div>}
        </div>
    </article>;
}
