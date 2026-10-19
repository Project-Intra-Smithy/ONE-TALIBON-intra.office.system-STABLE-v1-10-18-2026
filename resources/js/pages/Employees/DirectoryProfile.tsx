import { Link } from '@inertiajs/react';
import { UserRound } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import PageFrame from '../../components/PageFrame';

type Profile = { id: number; number: string; name: string | null; email: string | null; position: string; office: string | null; presence: 'online' | 'offline' };
export default function DirectoryProfile({ employee, isSelf }: { employee: Profile; isSelf: boolean }) {
    return <AppLayout title="Employee Profile"><PageFrame>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#142236]">
            <Link href="/employees" className="text-sm font-semibold text-blue-700 dark:text-blue-300">← Employee Directory</Link>
            <div className="mt-5 flex items-center gap-3"><UserRound size={27} /><h1 className="text-2xl font-bold">{employee.name || 'Employee'}</h1></div>
            <p className="mt-2 text-sm">{employee.number} · {employee.position}</p>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Office</dt><dd className="font-semibold">{employee.office || 'Not assigned'}</dd></div>
                <div><dt className="text-slate-500">Work email</dt><dd className="break-all font-semibold">{employee.email || 'Not recorded'}</dd></div>
                <div><dt className="text-slate-500">Portal presence</dt><dd className="font-semibold">{employee.presence === 'online' ? 'Online' : 'Offline'}</dd></div>
            </dl>
            <p className="mt-5 text-xs text-slate-500">Online means recent authenticated portal activity, not physical attendance.</p>
            {isSelf && <Link href="/hris/attendance" className="mt-5 inline-block rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white">My attendance</Link>}
        </section>
    </PageFrame></AppLayout>;
}
