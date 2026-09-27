import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
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

export default function MeetingRegister({
    meetings,
    onOpen,
    compact = false,
    preview = false,
}: {
    meetings: MunicipalMeeting[];
    onOpen: (meeting: MunicipalMeeting) => void;
    compact?: boolean;
    preview?: boolean;
}) {
    if (!meetings.length) {
        return <div className={compact ? 'px-3 py-4 text-[10px] text-[var(--municipal-muted)]' : 'municipal-panel border-dashed p-6 text-center text-sm text-[var(--municipal-muted)]'}>No meetings match this view.</div>;
    }

    return <div className={compact ? 'divide-y divide-[var(--municipal-border)]' : 'municipal-panel divide-y divide-[var(--municipal-border)] overflow-hidden'}>
        {meetings.map((meeting) => (
            <button
                key={meeting.id}
                type="button"
                onClick={() => onOpen(meeting)}
                className={`grid w-full min-w-0 gap-2 text-left transition hover:bg-[var(--municipal-hover)] ${compact ? 'px-3 py-1.5' : 'px-3 py-2'} ${preview ? 'lg:grid-cols-[82px_minmax(0,1fr)_96px_minmax(150px,.8fr)_24px]' : 'lg:grid-cols-[92px_minmax(260px,1.6fr)_84px_minmax(180px,.9fr)_96px_24px]'} lg:items-center`}
            >
                <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">{meeting.id}</div>
                    <div className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">{formatDate(meeting.date)}</div>
                </div>

                <div className="min-w-0">
                    <div className={`${preview ? 'truncate' : 'whitespace-normal'} text-[11px] font-semibold leading-4 text-[var(--municipal-text)]`}>{meeting.title}</div>
                    <div className={`mt-0.5 ${preview ? 'truncate' : 'whitespace-normal'} text-[9px] leading-3.5 text-[var(--municipal-muted)]`}>{meeting.organizingOffice}</div>
                </div>

                <div className="min-w-0 text-[10px] text-[var(--municipal-text)]">
                    <div className="flex items-center gap-1"><CalendarDays size={11} className="shrink-0 text-[var(--municipal-muted)]" />{meeting.time}</div>
                </div>

                <div className="min-w-0 text-[10px] text-[var(--municipal-muted)]">
                    <div className="flex items-start gap-1"><MapPin size={11} className="mt-0.5 shrink-0" /><span className={preview ? 'truncate' : 'whitespace-normal leading-4'}>{meeting.venue}</span></div>
                </div>

                {!preview ? (
                    <div>
                        <span className={'inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[9px] font-bold uppercase leading-none ' + statusTone[meeting.status]}>{meeting.status}</span>
                    </div>
                ) : null}

                <ArrowRight size={13} className="justify-self-end text-[var(--municipal-brand)]" aria-hidden="true" />
            </button>
        ))}
    </div>;
}
