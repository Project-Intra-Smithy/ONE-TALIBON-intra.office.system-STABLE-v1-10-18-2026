import { useMemo, useState } from 'react';
import { Network, Search } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import SystemDirectory from '../../components/municipal-systems/SystemDirectory';
import { municipalSystems, systemGroups } from '../../data/municipal/systems';

export default function Index() {
    const [q, setQ] = useState('');
    const [group, setGroup] = useState('');
    const [status, setStatus] = useState('');
    const systems = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return municipalSystems.filter((system) =>
            (!group || system.group === group)
            && (!status || system.status === status)
            && (!needle || [system.name, system.group, system.owningOffice, system.purpose, system.recordScope, system.integrationNote].join(' ').toLowerCase().includes(needle))
        );
    }, [q, group, status]);
    const counts = {
        active: systems.filter((system) => system.status === 'Active').length,
        integrated: systems.filter((system) => system.status === 'Integrated').length,
        notEnabled: systems.filter((system) => system.status === 'Not Enabled').length,
        planned: systems.filter((system) => system.status === 'Planned').length,
    };
    const summary = [['Active', counts.active], ['Integrated', counts.integrated], ['Not Enabled', counts.notEnabled], ['Planned', counts.planned]] as const;

    return <AppLayout title="Systems Directory"><PageFrame>
        <PageHeader eyebrow="Municipal systems map" title="Systems Directory" description="Internal directory and map of municipal systems, their owning offices, operating status, record scope, and current integration context." icon={Network} />
        <section className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-[#142236]" aria-label="Systems directory status summary">
            {summary.map(([label, value]) => <div key={label} className="flex items-baseline gap-1.5"><span className="text-sm font-bold tabular-nums text-slate-950 dark:text-slate-100">{value}</span><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span></div>)}
        </section>
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236] md:grid-cols-[1fr_240px_200px]">
            <label className="relative"><span className="sr-only">Search systems directory</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search system, office, scope, or context" className="min-h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" /></label>
            <select aria-label="System group" value={group} onChange={(event) => setGroup(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"><option value="">All groups</option>{systemGroups.map((item) => <option key={item}>{item}</option>)}</select>
            <select aria-label="System status" value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"><option value="">All statuses</option><option>Active</option><option>Integrated</option><option>Not Enabled</option><option>Planned</option></select>
        </div>
        <SystemDirectory systems={systems} />
    </PageFrame></AppLayout>;
}
