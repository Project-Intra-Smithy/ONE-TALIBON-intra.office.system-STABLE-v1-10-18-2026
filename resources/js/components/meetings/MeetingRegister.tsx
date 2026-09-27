import { CalendarDays, FileText, MapPin, UsersRound } from 'lucide-react';
import type { MunicipalMeeting } from '../../data/municipal/meetings';

const statusClass: Record<MunicipalMeeting['status'], string> = {
    Scheduled: 'employee-tone-info',
    Completed: 'employee-tone-success',
    Rescheduled: 'employee-tone-warning',
};

export default function MeetingRegister({ meetings }: { meetings: MunicipalMeeting[] }) {
    if (!meetings.length) return <div className="municipal-panel border-dashed p-6 text-center text-sm text-[var(--municipal-muted)]">No meetings match the current filters.</div>;

    return <div className="municipal-panel divide-y divide-[var(--municipal-border)] overflow-hidden">
        {meetings.map((meeting) => <details key={meeting.id} className="group">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-start justify-between gap-3 px-3 py-2 marker:hidden hover:bg-[var(--municipal-hover)]">
                <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">{meeting.id} · {meeting.organizingOffice}</div>
                    <h2 className="mt-0.5 break-words text-[13px] font-semibold leading-5">{meeting.title}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--municipal-muted)]"><span className="flex items-center gap-1"><CalendarDays size={12}/>{meeting.date} · {meeting.time}</span><span className="flex items-center gap-1"><MapPin size={12}/>{meeting.venue}</span></div>
                </div>
                <span className={`shrink-0 text-[11px] font-semibold ${statusClass[meeting.status]}`}>{meeting.status}</span>
            </summary>
            <div className="grid gap-3 border-t border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] p-3 sm:grid-cols-2">
                <div>
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]"><UsersRound size={12}/> Participants</div>
                    <div className="mt-1 text-xs leading-5">{meeting.participants.join(' · ')}</div>
                </div>
                <div>
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]"><FileText size={12}/> Related documents</div>
                    <div className="mt-1 text-xs leading-5">{meeting.relatedDocuments.join(' · ')}</div>
                </div>
                <div className="sm:col-span-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Agenda</div>
                    <ol className="mt-1 grid gap-1 text-xs leading-5 sm:grid-cols-2">{meeting.agenda.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol>
                </div>
            </div>
        </details>)}
    </div>;
}
