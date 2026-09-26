import { usePage } from '@inertiajs/react';
import PortalModuleCard from '../portal/PortalModuleCard';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { buildPortalModuleCatalog } from '../../navigation/portalModuleCatalog';
import type { SharedProps } from '../../types';

export default function PortalMenuOverview() {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const [query, setQuery] = useState('');
    const normalized = query.trim().toLowerCase();
    const modules = buildPortalModuleCatalog(workspaceExperience, permissions.navigation).filter((module) =>
        [module.title, ...module.items.map((item) => item.label)].join(' ').toLowerCase().includes(normalized));
    return <section id="portal-menu-overview" aria-labelledby="portal-menu-title" className="@container min-w-0 scroll-mt-24 space-y-3 border-t border-slate-200 pt-5 dark:border-slate-700">
        <header className="flex flex-wrap items-end justify-between gap-3">
            <div><div className="employee-functional-label text-[var(--municipal-brand)]">Explore ONE TALIBON</div><h2 id="portal-menu-title" className="employee-section-title mt-1">Portal Menu Overview</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Open available services. Planned services are marked below.</p></div>
            <label className="w-full sm:w-80"><span className="mb-1 block text-xs font-semibold">Search portal modules</span><span className="relative block"><Search size={16} className="absolute left-3 top-3.5 text-slate-500" aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a module or destination" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-900" /></span></label>
        </header>
        <div className="grid min-w-0 gap-3 @min-[560px]:grid-cols-2 @min-[800px]:grid-cols-3 @min-[1000px]:grid-cols-4 @min-[1400px]:grid-cols-5">
            {modules.map((module) => <PortalModuleCard key={module.key} module={module} />)}
        </div>
        {modules.length === 0 && <p role="status" className="py-6 text-sm text-slate-500">No modules match “{query}”. Try another name.</p>}
    </section>;
}
