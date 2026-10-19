import { Link } from '@inertiajs/react';
import { Clock3 } from 'lucide-react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';

type AttendanceEvent = { id: number; occurred_at: string; event_type: string; source: string };
type Props = { employee: { name: string; number: string; office: string | null }; events: AttendanceEvent[] };

export default function Attendance({ employee, events }: Props) {
    return <AppLayout title="My Attendance"><PageFrame>
        <PageHeader eyebrow="Employee directory" title="My Attendance" icon={Clock3}
            description="Recorded attendance events only. Missing records are not proof of absence; no biometric device is claimed connected."
            aside={<Link href="/employees" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600">Employee Directory</Link>} />
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#142236]">
            <h2 className="text-lg font-bold">{employee.name}</h2>
            <p className="text-sm text-slate-500">{employee.number} · {employee.office || 'Office unassigned'}</p>
            <ul className="mt-5 divide-y divide-slate-200 dark:divide-slate-700">
                {events.map((event) => <li key={event.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
                    <strong>{event.event_type}</strong><span>{new Date(event.occurred_at).toLocaleString()}</span>
                    <span className="text-slate-500">Source: {event.source}</span>
                </li>)}
            </ul>
            {events.length === 0 && <p className="mt-5 text-sm text-slate-500">No recorded attendance events.</p>}
        </section>
    </PageFrame></AppLayout>;
}
