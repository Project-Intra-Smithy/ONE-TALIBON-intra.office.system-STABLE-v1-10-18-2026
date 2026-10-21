import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { isStagedInertiaPath } from '../../navigation/stagedRoutes';
import type { MetricGroupData } from './types';

export default function MetricGroup({ group }: { group: MetricGroupData }) {
    const title = ({ personal: 'My work', office: 'Office workload', executive: 'Municipal workload', system: 'Accounts and security' } as Record<string, string>)[group.key] || group.title;
    // Counts may overlap: compare magnitude, never imply a completion percentage.
    const maximum = Math.max(1, ...group.metrics.map(metric => Math.max(0, metric.value)));
    return <section className="municipal-panel overflow-hidden" aria-labelledby={'dashboard-' + group.key + '-metrics'}>
        <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
            <h2 id={'dashboard-' + group.key + '-metrics'} className="text-base font-bold sm:text-lg">{title}</h2>
        </header>
        <div className="workspace-metrics">
            {group.metrics.map((metric) => {
                const className = 'workspace-metric group relative min-w-0 p-5';
                const content = <>
                <div className="text-3xl font-bold leading-tight tabular-nums">{metric.value.toLocaleString()}</div>
                <div className="mt-2 pr-4 text-base leading-6 text-slate-700 dark:text-slate-200">{metric.label}</div>
                <div className="workspace-count-track" aria-hidden="true"><span style={{ width: `${Math.max(0, metric.value) / maximum * 100}%` }} /></div>
                {isStagedInertiaPath(metric.link) && <ArrowUpRight size={14} className="absolute right-4 top-4 text-slate-600 group-hover:text-[#1769aa] dark:group-hover:text-blue-300" aria-hidden="true" />}
                </>;
                return isStagedInertiaPath(metric.link)
                    ? <Link key={metric.label} href={metric.link} aria-label={metric.label + ': ' + metric.value + '. Open related work.'} className={`${className} transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40`}>{content}</Link>
                    : <div key={metric.label} className={className}>{content}</div>;
            })}
        </div>
        <p className="px-5 pb-5 text-base text-slate-600 dark:text-slate-300">Bars compare counts in this section. Categories may overlap.</p>
    </section>;
}
