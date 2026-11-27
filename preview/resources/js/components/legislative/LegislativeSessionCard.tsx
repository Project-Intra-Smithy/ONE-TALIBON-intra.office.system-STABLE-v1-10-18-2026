import { useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import LegislativeAgendaList from './LegislativeAgendaList';
import { formatDateTimePH } from '../../lib/format';

import type { LegislativeSession } from './types';
const pretty = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export default function LegislativeSessionCard({ session, canManage }: { session: LegislativeSession; canManage: boolean }) {
    const [showAgenda, setShowAgenda] = useState(false);
    const [showAgendaForm, setShowAgendaForm] = useState(false);
    const agenda = useForm({ sequence_no: session.agenda_items.length + 1, title: '', description: '' });
    const submitAgenda = (event: FormEvent) => {
        event.preventDefault();
        agenda.post(`/legislative-workspace/sessions/${session.id}/agenda`, {
            preserveScroll: true,
            onSuccess: () => {
                agenda.reset('title', 'description');
                agenda.setData('sequence_no', agenda.data.sequence_no + 1);
                setShowAgendaForm(false);
            },
        });
    };
    const agendaId = `session-agenda-${session.id}`;
    const agendaFormId = `session-agenda-form-${session.id}`;
    const toggleAgenda = () => {
        setShowAgendaForm(false);
        setShowAgenda((value) => !value);
    };

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-3 dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">
            <div className="flex flex-col gap-2 @min-[560px]:flex-row @min-[560px]:items-start @min-[560px]:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-bold text-[var(--status-info-fg)]">{session.session_code}</span><span className="text-slate-400">·</span><span className="font-semibold text-[var(--ink-secondary)]">{pretty(session.session_type)}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase text-slate-600 dark:bg-[var(--surface-recessed)] dark:text-[var(--ink-secondary)]">{pretty(session.status)}</span></div>
                    <h3 className="mt-1 text-sm font-bold leading-4 text-[var(--ink-primary)]">{session.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-[var(--ink-secondary)]"><span>{formatDateTimePH(session.scheduled_at)}</span><span>{session.location || 'Location TBD'}</span><span>{session.agenda_items.length} agenda {session.agenda_items.length === 1 ? 'item' : 'items'}</span></div>
                </div>
                <button type="button" aria-expanded={showAgenda} aria-controls={agendaId} onClick={toggleAgenda} className="w-full shrink-0 rounded-md border border-indigo-200 px-3 py-1.5 @min-[560px]:w-auto text-xs font-semibold text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/25 dark:border-[var(--status-info-border)] dark:text-[var(--status-info-fg)]">{showAgenda ? 'Hide agenda' : 'View agenda'}</button>
            </div>
            {showAgenda && (
                <div id={agendaId} className="mt-3 border-t border-slate-100 pt-3 dark:border-[var(--border-control)]">
                    {canManage && (
                        <div className="mb-2.5">
                            <button type="button" aria-expanded={showAgendaForm} aria-controls={agendaFormId} onClick={() => setShowAgendaForm((value) => !value)} className="w-full rounded-md bg-indigo-50 px-3 py-1.5 @min-[560px]:w-auto text-xs font-semibold text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/25 dark:bg-[var(--status-info-bg)] dark:text-[var(--status-info-fg)]">{showAgendaForm ? 'Cancel agenda entry' : 'Add agenda item'}</button>
                            {showAgendaForm && (
                                <form id={agendaFormId} onSubmit={submitAgenda} className="mt-2 grid gap-2 rounded-lg bg-indigo-50/50 p-2.5 dark:bg-[var(--status-info-bg)] @min-[620px]:grid-cols-[90px_1fr_auto]">
                                    <input aria-label="Agenda sequence number" type="number" min={1} value={agenda.data.sequence_no} onChange={(event) => agenda.setData('sequence_no', Number(event.target.value))} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/25 dark:border-[var(--border-control)] dark:bg-[var(--surface-canvas)] dark:text-[var(--ink-primary)]" />
                                    <input aria-label="Agenda item title" required placeholder="Agenda item title" value={agenda.data.title} onChange={(event) => agenda.setData('title', event.target.value)} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-700/25 dark:border-[var(--border-control)] dark:bg-[var(--surface-canvas)] dark:text-[var(--ink-primary)]" />
                                    <button type="submit" disabled={agenda.processing} className="rounded-md bg-[#0e4d36] px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-700/30 disabled:opacity-50">Add agenda item</button>
                                </form>
                            )}
                        </div>
                    )}
                    <LegislativeAgendaList items={session.agenda_items} />
                </div>
            )}
        </article>
    );
}
