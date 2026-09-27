import { CalendarDays, FileText, MapPin, UsersRound, X } from 'lucide-react';
import type { MunicipalMeeting } from '../../data/municipal/meetings';

const statusTone: Record<MunicipalMeeting['status'], string> = {
    Scheduled: 'border-[#cfe0f6] bg-[#eef5ff] text-[#265fa8]',
    Completed: 'border-[#cfe6d5] bg-[#eef8f1] text-[#17633f]',
    Rescheduled: 'border-[#f0dfb4] bg-[#fff8e8] text-[#9a6a08]',
};

const formatDate = (value: string) => new Date(value + 'T00:00:00+08:00').toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

export default function MeetingDetailModal({ meeting, onClose }: { meeting: MunicipalMeeting; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={onClose}>
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="meeting-detail-title"
                className="w-full max-w-3xl overflow-hidden rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="flex items-start justify-between gap-4 border-b border-[var(--municipal-border)] px-4 py-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">{meeting.id}</span>
                            <span className={'whitespace-nowrap rounded-full border px-2 py-1 text-[9px] font-bold uppercase leading-none ' + statusTone[meeting.status]}>{meeting.status}</span>
                        </div>
                        <h2 id="meeting-detail-title" className="mt-1 text-lg font-bold text-[var(--municipal-text)]">{meeting.title}</h2>
                        <p className="mt-0.5 text-[10px] text-[var(--municipal-muted)]">{meeting.organizingOffice}</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close meeting" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--municipal-border)] text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]">
                        <X size={15} />
                    </button>
                </header>

                <div className="space-y-3 px-4 py-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]"><CalendarDays size={11} /> Schedule</div>
                            <div className="mt-1 text-[11px] font-semibold text-[var(--municipal-text)]">{formatDate(meeting.date)} · {meeting.time}</div>
                        </div>
                        <div className="rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]"><MapPin size={11} /> Venue</div>
                            <div className="mt-1 text-[11px] font-semibold text-[var(--municipal-text)]">{meeting.venue}</div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <section>
                            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]"><UsersRound size={11} /> Participants</div>
                            <div className="mt-1 text-[11px] leading-5 text-[var(--municipal-text)]">{meeting.participants.join(' · ')}</div>
                        </section>
                        <section>
                            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]"><FileText size={11} /> Related documents</div>
                            <div className="mt-1 text-[11px] leading-5 text-[var(--municipal-text)]">{meeting.relatedDocuments.join(' · ')}</div>
                        </section>
                    </div>

                    <section className="border-t border-[var(--municipal-border)] pt-3">
                        <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Agenda</div>
                        <ol className="mt-1 grid gap-1 text-[11px] leading-5 sm:grid-cols-2">
                            {meeting.agenda.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}
                        </ol>
                    </section>
                </div>
            </section>
        </div>
    );
}
