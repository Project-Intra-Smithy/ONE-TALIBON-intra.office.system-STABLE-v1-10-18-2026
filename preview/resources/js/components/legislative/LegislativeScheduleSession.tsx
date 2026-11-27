import { useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { DateTimeInput } from '../ui';

export default function LegislativeScheduleSession() {
    const [open, setOpen] = useState(false);
    const form = useForm({ session_code: '', session_type: 'regular', title: '', scheduled_at: '', location: '', notes: '' });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/legislative-workspace/sessions', {
            preserveScroll: true,
            onSuccess: () => { form.reset(); setOpen(false); },
        });
    };

    return (
        <section className="tcds-card" aria-label="Session scheduling">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div><div className="text-xs font-semibold text-[var(--ink-primary)]">Schedule a legislative session</div><div className="mt-0.5 text-xs text-[var(--ink-secondary)]">Available to authorized legislative operators.</div></div>
                <button type="button" aria-expanded={open} aria-controls="legislative-session-form" onClick={() => setOpen((value) => !value)} className="municipal-primary-button w-full @min-[520px]:w-auto">{open ? 'Close' : 'Schedule session'}</button>
            </div>
            {open && (
                <form id="legislative-session-form" onSubmit={submit} className="grid gap-3 border-t border-[var(--border-default)] p-4 @min-[620px]:grid-cols-2 @min-[980px]:grid-cols-6">
                    <label className="grid gap-1 text-xs font-semibold text-[var(--ink-secondary)]"><span>Session code</span><input required value={form.data.session_code} onChange={(e) => form.setData('session_code', e.target.value)} className="tcds-input" /></label>
                    <label className="grid gap-1 text-xs font-semibold text-[var(--ink-secondary)]"><span>Session type</span><select value={form.data.session_type} onChange={(e) => form.setData('session_type', e.target.value)} className="tcds-input"><option value="regular">Regular</option><option value="special">Special</option><option value="committee">Committee</option><option value="other">Other</option></select></label>
                    <label className="grid gap-1 text-xs font-semibold text-[var(--ink-secondary)] @min-[620px]:col-span-2"><span>Title</span><input required value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className="tcds-input" /></label>
                    <div className="grid gap-1 text-xs font-semibold text-[var(--ink-secondary)]"><label htmlFor="leg-sched-at">Scheduled date/time</label><DateTimeInput id="leg-sched-at" required value={form.data.scheduled_at} onChange={(next) => form.setData('scheduled_at', next)} /></div>
                    <label className="grid gap-1 text-xs font-semibold text-[var(--ink-secondary)]"><span>Location</span><input value={form.data.location} onChange={(e) => form.setData('location', e.target.value)} className="tcds-input" /></label>
                    <div className="flex gap-2 @min-[620px]:col-span-2 @min-[980px]:col-span-6"><button type="submit" disabled={form.processing} className="municipal-primary-button">Schedule</button><button type="button" onClick={() => setOpen(false)} className="municipal-secondary-button">Cancel</button></div>
                </form>
            )}
        </section>
    );
}
