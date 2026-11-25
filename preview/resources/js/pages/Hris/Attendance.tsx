import { Link } from '@inertiajs/react';
import { Clock3 } from 'lucide-react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';
import { formatDateTimePH, humanizeSlug } from '../../lib/format';

type AttendanceEvent = { id: number; occurred_at: string; event_type: string; source: string };
type Props = { employee: { name: string; number: string; office: string | null }; events: AttendanceEvent[] };

export default function Attendance({ employee, events }: Props) {
    return <AppLayout title="My Attendance"><PageFrame>
        <PageHeader eyebrow="Employee directory" title="My Attendance" icon={Clock3}
            description="Recorded attendance events only. Missing records are not proof of absence; no biometric device is claimed connected."
            aside={<Link href="/employees" className="municipal-secondary-button">Employee Directory</Link>} />
        <section className="tcds-card p-5">
            <h2 className="text-lg font-bold text-[var(--ink-primary)]">{employee.name}</h2>
            <p className="text-sm text-[var(--ink-secondary)]">{employee.number} · {employee.office || 'Office unassigned'}</p>
            <ul className="mt-5 divide-y divide-[var(--border-default)]">
                {events.map((event) => <li key={event.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm text-[var(--ink-primary)]">
                    <strong>{humanizeSlug(event.event_type)}</strong><span>{formatDateTimePH(event.occurred_at)}</span>
                    <span className="text-[var(--ink-secondary)]">Source: {event.source}</span>
                </li>)}
            </ul>
            {events.length === 0 && <p className="mt-5 text-sm text-[var(--ink-secondary)]">No recorded attendance events.</p>}
        </section>
    </PageFrame></AppLayout>;
}
