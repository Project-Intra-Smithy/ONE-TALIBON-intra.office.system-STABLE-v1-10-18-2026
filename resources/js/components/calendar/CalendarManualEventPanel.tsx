import { router } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';

type ManageableEvent = {
    id: number;
    title: string;
    description?: string | null;
    priority: string;
    starts_at: string;
    ends_at?: string | null;
    all_day: boolean;
    location?: string | null;
    calendar_bucket?: 'personal' | 'office' | 'municipality';
    can_manage?: boolean;
    manual_version: number;
    start_date: string;
    end_date?: string | null;
};

type Permissions = { personal: boolean; office: boolean; municipality: boolean };
type Draft = {
    scope: 'personal' | 'office';
    title: string;
    description: string;
    priority: 'normal' | 'high' | 'urgent';
    location: string;
    starts_at: string;
    ends_at: string;
    all_day: boolean;
    expected_revision: number;
};

// Interpret display inputs in the application's Asia/Manila timezone, rather
// than silently using the visitor browser timezone.
function manilaLocal(iso?: string | null): string {
    if (!iso || Number.isNaN(Date.parse(iso))) return '';
    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit',
        day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso)).replace(' ', 'T');
}
const toOffset = (value: string) => value ? value + ':00+08:00' : null;
const freshDraft = (scope: 'personal' | 'office'): Draft => ({
    scope, title: '', description: '', priority: 'normal',
    location: '', starts_at: '', ends_at: '', all_day: false, expected_revision: 1,
});

export default function CalendarManualEventPanel({
    events, permissions,
}: { events: ManageableEvent[]; permissions: Permissions }) {
    const editable = useMemo(() => events.filter((event) => event.can_manage), [events]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<Draft>(freshDraft('personal'));
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [expanded, setExpanded] = useState(false);
    const reset = () => { setEditingId(null); setDraft(freshDraft('personal')); setErrors([]); };

    if (!permissions.personal && !permissions.office) return null;

    const chooseEvent = (value: string) => {
        setErrors([]);
        if (value === '') {
            reset();
            return;
        }
        const event = editable.find((item) => item.id === Number(value));
        if (!event) return;
        setEditingId(event.id);
        setDraft({
            scope: event.calendar_bucket === 'office' ? 'office' : 'personal',
            title: event.title, description: event.description ?? '',
            priority: (['high', 'urgent'].includes(event.priority) ? event.priority : 'normal') as Draft['priority'],
            location: event.location ?? '',
            starts_at: event.all_day ? event.start_date : manilaLocal(event.starts_at),
            ends_at: event.all_day ? (event.end_date ?? '') : manilaLocal(event.ends_at),
            all_day: event.all_day, expected_revision: event.manual_version,
        });
    };

    const payload = () => ({
        ...draft,
        starts_at: draft.all_day ? draft.starts_at : toOffset(draft.starts_at),
        ends_at: draft.all_day ? (draft.ends_at || null) : toOffset(draft.ends_at),
    });
    const handleError = (validation: Record<string, string>) => {
        setErrors(Object.values(validation));
        setBusy(false);
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        setErrors([]);
        if (!draft.title.trim() || !draft.starts_at) {
            setErrors(['A title and start date are required.']); return;
        }
        if (draft.ends_at && draft.ends_at < draft.starts_at) {
            setErrors(['End must not precede start.']); return;
        }
        setBusy(true);
        const options = {
            preserveScroll: true,
            onError: handleError,
            onSuccess: () => reset(),
            onFinish: () => setBusy(false),
        };
        if (editingId === null) {
            router.post('/calendar/events', payload(), options);
        } else {
            router.put('/calendar/events/' + editingId, payload(), options);
        }
    };
    const cancel = () => {
        if (editingId === null || busy || !window.confirm('Cancel this calendar event?')) return;
        setBusy(true);
        router.delete('/calendar/events/' + editingId, {
            data: { expected_revision: draft.expected_revision },
            preserveScroll: true,
            onError: handleError,
            onSuccess: () => reset(),
            onFinish: () => setBusy(false),
        });
    };

    return <section className="municipal-panel p-4" aria-label="Manage calendar entries">
        <button type="button" className="municipal-action municipal-action--secondary" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Hide calendar editor' : 'Add or manage an event'}
        </button>
        {expanded && <form onSubmit={submit} className="mt-4 grid gap-3">
            <p className="text-sm text-[var(--municipal-muted)]">
                Personal and authorized office entries only. Workflow deadlines, leave and municipality events are read-only.
            </p>
            {editable.length > 0 && <label className="text-sm">Entry
                <select className="municipal-field ml-2" value={editingId ?? ''} onChange={(event) => chooseEvent(event.target.value)}>
                    <option value="">New entry</option>
                    {editable.map((event) => <option value={event.id} key={event.id}>{event.title}</option>)}
                </select>
            </label>}
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">Calendar
                    <select className="municipal-field mt-1 w-full" value={draft.scope}
                        disabled={editingId !== null}
                        onChange={(event) => setDraft({ ...draft, scope: event.target.value as Draft['scope'] })}>
                        {permissions.personal && <option value="personal">Personal</option>}
                        {permissions.office && <option value="office">My office</option>}
                    </select>
                </label>
                <label className="text-sm">Priority
                    <select className="municipal-field mt-1 w-full" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Draft['priority'] })}>
                        <option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
                    </select>
                </label>
                <label className="text-sm">Title
                    <input className="municipal-field mt-1 w-full" maxLength={190} required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })}/>
                </label>
                <label className="text-sm">Location (optional)
                    <input className="municipal-field mt-1 w-full" maxLength={255} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })}/>
                </label>
                <label className="text-sm">Start (Manila time)
                    <input className="municipal-field mt-1 w-full" type={draft.all_day ? 'date' : 'datetime-local'} required value={draft.starts_at} onChange={(event) => setDraft({ ...draft, starts_at: event.target.value })}/>
                </label>
                <label className="text-sm">End (optional, Manila time)
                    <input className="municipal-field mt-1 w-full" type={draft.all_day ? 'date' : 'datetime-local'} value={draft.ends_at} onChange={(event) => setDraft({ ...draft, ends_at: event.target.value })}/>
                </label>
            </div>
            <label className="text-sm">Description (optional)
                <textarea className="municipal-field mt-1 w-full" maxLength={2000} rows={2} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })}/>
            </label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.all_day} onChange={(event) => {
                const enabled = event.target.checked;
                setDraft({ ...draft, all_day: enabled,
                    starts_at: enabled ? draft.starts_at.slice(0, 10) : (draft.starts_at ? draft.starts_at.slice(0, 10) + 'T09:00' : ''),
                    ends_at: enabled ? draft.ends_at.slice(0, 10) : (draft.ends_at ? draft.ends_at.slice(0, 10) + 'T10:00' : ''),
                });
            }}/> All day</label>
            {errors.length > 0 && <div role="alert" aria-live="assertive" className="text-sm text-red-700">{errors.join(' ')}</div>}
            <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={busy} className="municipal-action municipal-action--primary">{busy ? 'Saving…' : editingId === null ? 'Create event' : 'Save changes'}</button>
                {editingId !== null && <button type="button" disabled={busy} onClick={cancel} className="municipal-action municipal-action--secondary">Cancel event</button>}
            </div>
        </form>}
    </section>;
}
