import { Link } from '@inertiajs/react';
import { Clock, ExternalLink, MapPin } from 'lucide-react';
import { Button, Dialog, StatusBadge, toneForWorkState } from '../ui';
import type { CalendarEvent } from '../../pages/Calendar/Index';
import { humanizeSlug } from '../../lib/format';

export default function CalendarEventDetails({ event, timezone, onClose }: { event: CalendarEvent | null; timezone: string; onClose: () => void }) {
    const format = (value: string) => Number.isNaN(Date.parse(value)) ? 'Date unavailable' : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(new Date(value));
    return <Dialog open={Boolean(event)} onClose={onClose} title={event?.title ?? 'Event Details'} description={event ? humanizeSlug(event.event_type) : undefined}
        footer={<div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" onClick={onClose}>Close</Button>{event?.action_url && event.action_url !== '/calendar' && <Link href={event.action_url} className="municipal-primary-button">Open Related Work <ExternalLink size={15} aria-hidden="true" /></Link>}</div>}>
        {event && <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2"><StatusBadge tone={toneForWorkState(event.status)}>{humanizeSlug(event.status)}</StatusBadge><StatusBadge tone={event.priority === 'urgent' ? 'danger' : event.priority === 'high' ? 'warn' : 'neutral'}>{humanizeSlug(event.priority)}</StatusBadge></div>
            <div className="flex items-start gap-2 text-[var(--ink-primary)]"><Clock size={16} aria-hidden="true" className="shrink-0 text-[var(--brand-ink)]" /><span>{format(event.starts_at)}{event.ends_at ? ` to ${format(event.ends_at)}` : ''}{event.all_day ? ' · All day' : ''}</span></div>
            {event.location && <div className="flex items-start gap-2"><MapPin size={16} aria-hidden="true" className="shrink-0 text-[var(--brand-ink)]" /><span>{event.location}</span></div>}
            {event.department && <p className="text-xs font-semibold text-[var(--ink-secondary)]">Office: {event.department.name}</p>}
            {event.description && <p className="whitespace-pre-wrap break-words rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3 leading-6 text-[var(--ink-secondary)]">{event.description}</p>}
        </div>}
    </Dialog>;
}
