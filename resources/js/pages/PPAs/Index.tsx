import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import { ClipboardList } from 'lucide-react';
import { useMemo, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import PPADetailPanel from '../../components/ppas/PPADetailPanel';
import PPAFilters from '../../components/ppas/PPAFilters';
import PPARegister from '../../components/ppas/PPARegister';
import PPASummary from '../../components/ppas/PPASummary';
import { ppaRecords } from '../../data/municipal/ppas';
import type { PPAFilters as FilterState, PPARecord } from '../../data/municipal/ppas.types';
import AppLayout from '../../layouts/AppLayout';

const initialFilters: FilterState = { query: '', sector: '', office: '', year: '', plan: '', fundingSource: '', status: '' };

export default function Index() {
    const [filters, setFilters] = useState(() => ({ ...initialFilters, query: typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('search') ?? '' }));
    const [selected, setSelected] = useState<PPARecord | null>(null);
    const records = useMemo(() => {
        const query = filters.query.trim().toLowerCase();
        return ppaRecords.filter((record) => {
            const searchable = [record.title, record.sector, record.responsibleOffice, record.relatedDevelopmentPlan, record.fundingSource, record.id].join(' ').toLowerCase();
            return (!query || searchable.includes(query))
                && (!filters.sector || record.sector === filters.sector)
                && (!filters.office || record.responsibleOffice === filters.office)
                && (!filters.year || String(record.year) === filters.year)
                && (!filters.plan || record.relatedDevelopmentPlan === filters.plan)
                && (!filters.fundingSource || record.fundingSource === filters.fundingSource)
                && (!filters.status || record.status === filters.status);
        });
    }, [filters]);

    return <AppLayout title="Programs, Projects and Activities">
        <PageFrame className="max-w-[1480px]" density="compact">
            <PageHeader
                eyebrow="Planning and implementation register"
                title="Programs, Projects and Activities"
                description="Municipal PPA reference register. Status and related-project counts are reference data; no completion percentage is recorded for PPAs."
                icon={ClipboardList}
                aside={<div className="text-right text-xs text-[var(--municipal-muted)]"><strong className="text-[var(--municipal-text)]">{records.length}</strong> of {ppaRecords.length} records</div>}
            />
            <PortalWorkspaceNav current="ppas" destinations={['ppas', 'projectMonitoring', 'developmentPlans']} />
            <PPAFilters filters={filters} onChange={(next) => { setFilters(next); setSelected(null); }} />
            <PPARegister records={records} selectedId={selected?.id} onSelect={setSelected} />
            {selected ? <PPADetailPanel record={selected} onClose={() => setSelected(null)} /> : null}
            <details className="group municipal-panel">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold marker:hidden">
                    <span>PPA summary</span>
                    <span className="text-[var(--municipal-brand)] group-open:hidden">Show</span>
                    <span className="hidden text-[var(--municipal-brand)] group-open:inline">Hide</span>
                </summary>
                <div className="border-t border-[var(--municipal-border)] p-3"><PPASummary records={records} /></div>
            </details>
        </PageFrame>
    </AppLayout>;
}
