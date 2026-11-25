import { ChevronRight, FolderKanban, Paperclip } from 'lucide-react';
import { formatPhpCompact } from '../../data/municipal/planningGovernance';
import type { PPARecord } from '../../data/municipal/ppas.types';
import { EmptyState, StatusBadge } from '../ui';

const statusTone: Record<PPARecord['status'], 'neutral' | 'warn' | 'info' | 'ok' | 'danger'> = {
    Draft: 'neutral',
    'For MPDC Review': 'warn',
    Planned: 'neutral',
    'For Procurement': 'warn',
    Ongoing: 'info',
    Completed: 'ok',
    'On Hold': 'danger',
    Archived: 'neutral',
};

type Props = {
    records: PPARecord[];
    selectedId?: string;
    docCountsByPpa?: Record<string, number>;
    onSelect: (record: PPARecord | null) => void;
};

export default function PPARegister({ records, selectedId, docCountsByPpa = {}, onSelect }: Props) {
    if (!records.length) {
        return (
            <EmptyState
                icon={<FolderKanban size={24} aria-hidden="true" />}
                title="No PPAs match the current filters"
                description="Adjust the search or filter criteria to view other reference records."
            />
        );
    }

    return (
        <div tabIndex={0} role="region" aria-label="PPA register" className="tcds-table-region">
            <table className="tcds-table" data-stack-mobile="true">
                <thead>
                    <tr>
                        <th scope="col">AIP Code &amp; PPA</th>
                        <th scope="col">Implementing Office</th>
                        <th scope="col" className="text-right">Allocation</th>
                        <th scope="col">Status</th>
                        <th scope="col" className="text-right">Docs</th>
                        <th scope="col" className="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record) => {
                        const active = selectedId === record.id;
                        const docCount = docCountsByPpa[record.id] ?? 0;
                        return (
                            <tr
                                key={record.id}
                                aria-selected={active}
                                className={active ? 'bg-[var(--brand-soft)]' : undefined}
                            >
                                <th scope="row" className="max-w-md font-normal">
                                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs font-bold text-[var(--brand-ink)]">
                                        <span>{record.id}</span>
                                        <span className="font-normal text-[var(--ink-secondary)]">· {record.aipRefCode}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(record)}
                                        className="mt-0.5 min-h-11 py-2 text-left text-sm font-semibold text-[var(--ink-primary)] hover:text-[var(--brand-ink)] hover:underline"
                                    >
                                        {record.title}
                                    </button>
                                    <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                        {record.sector} · {record.fundingSource} · {record.priority} priority
                                    </div>
                                </th>
                                <td data-label="Office" className="text-sm text-[var(--ink-secondary)]">
                                    <div>{record.responsibleOffice}</div>
                                    <div className="mt-0.5 text-xs opacity-80">{record.relatedDevelopmentPlan}</div>
                                </td>
                                <td data-label="Allocation" className="whitespace-nowrap text-right font-mono text-sm font-bold tabular-nums text-[var(--ink-primary)]">
                                    {formatPhpCompact(record.budgetTotal)}
                                </td>
                                <td data-label="Status">
                                    <StatusBadge tone={statusTone[record.status]}>{record.status}</StatusBadge>
                                </td>
                                <td data-label="Docs" className="text-right">
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ${
                                            docCount > 0
                                                ? 'border-[var(--brand-soft-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                                : 'border-[var(--border-default)] text-[var(--ink-secondary)]'
                                        }`}
                                    >
                                        <Paperclip size={11} aria-hidden="true" />
                                        <span>{docCount}</span>
                                    </span>
                                </td>
                                <td data-label="Action" className="text-right">
                                    <button
                                        data-ppa-trigger={record.id}
                                        id={`ppa-select-${record.id}`}
                                        type="button"
                                        onClick={() => onSelect(active ? null : record)}
                                        aria-expanded={active}
                                        aria-controls={active ? 'selected-ppa-detail' : undefined}
                                        className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)] transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
                                    >
                                        <span>View</span>
                                        <ChevronRight size={14} aria-hidden="true" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
