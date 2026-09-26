import { Link } from '@inertiajs/react';
import type { PortalModule } from '../../navigation/portalModuleCatalog';

export default function PortalModuleCard({ module: { title, icon: Icon, items } }: { module: PortalModule }) {
    return <article className="municipal-panel min-w-0 p-4">
        <div className="mb-2 flex items-start gap-2 text-[var(--municipal-brand)]"><Icon size={19} className="mt-0.5 shrink-0" aria-hidden="true" /><h3 className="text-sm font-bold leading-5">{title}</h3></div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">{items.map((item) => <li key={item.key}>
            {item.status === 'available' && item.href ? <Link href={item.href} className="flex min-h-11 items-center rounded px-1 py-2 text-sm hover:bg-[var(--municipal-brand-soft)] focus-visible:outline-2 focus-visible:outline-[var(--municipal-brand)]">{item.label}</Link> : <div className="py-2 text-sm text-slate-500 dark:text-slate-400"><span>{item.label}</span><span className="mt-1 block text-xs font-semibold">Planned</span></div>}
        </li>)}</ul>
    </article>;
}
