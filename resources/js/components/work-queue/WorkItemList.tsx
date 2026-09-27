import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Building2, CheckSquare2, Clock3, Square } from 'lucide-react';
import { withReturnContext } from '../../navigation/returnContext';
import {
    formatWorkDate,
    formatWorkDateTime,
    humanizeWorkValue,
    workDueLabel,
    workDueTone,
    workRelativeTime,
    workStatusTone,
} from './presentation';
import type { Paginator } from './types';

const priorityTone: Record<string, string> = {
    normal: 'employee-tone-neutral',
    high: 'employee-tone-warning',
    urgent: 'employee-tone-danger',
};

export default function WorkItemList({ records, title }: { records: Paginator; title: string }) {
    const { url } = usePage();

    return (
        <section className="municipal-panel overflow-hidden" aria-labelledby="work-item-list-title">
            <div className="employee-panel-header flex flex-col gap-1 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">Task checklist</div>
                    <h2 id="work-item-list-title" className="employee-section-title text-[var(--municipal-text)]">{title}</h2>
                </div>
                <div className="employee-metadata text-[var(--municipal-muted)]">
                    {records.total === 0 ? 'No matching items' : `Showing ${records.from || 1}-${records.to || records.data.length} of ${records.total}`}
                </div>
            </div>

            <div className="employee-table-heading employee-subsection-bar hidden grid-cols-[32px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_64px] gap-3 border-b border-[var(--municipal-border)] text-[var(--municipal-muted)] xl:grid">
                <div><span className="sr-only">Completion state</span></div><div>Task / Work</div><div>Accountability</div><div>Assignment</div><div>Due / activity</div><div>Next action</div><div />
            </div>

            <div className="divide-y divide-[var(--municipal-border)]">
                {records.data.map((item) => {
                    const updatedRecency = workRelativeTime(item.updatedAt);
                    const updatedExact = formatWorkDateTime(item.updatedAt);
                    const statusLabel = humanizeWorkValue(item.status);
                    const completed = item.dueState === 'completed';
                    const ChecklistIcon = completed ? CheckSquare2 : Square;

                    return (
                        <article key={item.id} className={`employee-record-row py-2.5 ${completed ? 'bg-[var(--municipal-surface-subtle)]' : 'hover:bg-[var(--municipal-hover)]'}`}>
                            <div className="grid min-w-0 gap-2.5 xl:grid-cols-[32px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_64px] xl:items-center">
                                <div className="flex min-h-8 items-start pt-0.5 text-[var(--municipal-brand)]" title={completed ? 'Workflow completed' : 'Completion is controlled by the workflow record'}>
                                    <ChecklistIcon size={20} strokeWidth={1.8} aria-hidden="true" />
                                    <span className="sr-only">{completed ? 'Completed workflow item' : 'Active workflow item'}</span>
                                </div>

                                <div className="min-w-0">
                                    <div className="employee-metadata flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                        <span className="employee-tone-info font-bold">{item.reference}</span>
                                        <span className="text-[var(--municipal-muted)]">{humanizeWorkValue(item.transactionType)}</span>
                                    </div>
                                    <h3 className={`employee-record-title mt-0.5 line-clamp-2 text-[var(--municipal-text)] ${completed ? 'line-through decoration-[var(--municipal-border-strong)]' : ''}`}>{item.title}</h3>
                                    <div className="employee-metadata mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className={`${workStatusTone(item.status)} font-semibold`}>{statusLabel}</span>
                                        <span className="text-[var(--municipal-border-strong)]" aria-hidden="true"> / </span>
                                        <span className={priorityTone[item.priority] || priorityTone.normal}>{humanizeWorkValue(item.priority)} priority</span>
                                        <span className="text-[var(--municipal-border-strong)]" aria-hidden="true"> / </span>
                                        <span className={`font-semibold ${workDueTone[item.dueState]}`}>{workDueLabel[item.dueState]}</span>
                                        {item.requiresAction ? <><span className="text-[var(--municipal-border-strong)]" aria-hidden="true"> / </span><span className="employee-tone-info font-semibold">Needs action</span></> : null}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:contents">
                                    <div className="min-w-0">
                                        <div className="employee-functional-label text-[var(--municipal-muted)] xl:hidden">Accountability</div>
                                        <div className="employee-metadata mt-0.5 flex items-start gap-1.5 font-semibold text-[var(--municipal-text)]">
                                            <Building2 size={12} className="mt-0.5 shrink-0 text-[var(--municipal-muted)]" aria-hidden="true" />
                                            <span className="line-clamp-2">{item.currentOffice?.shortName || item.currentOffice?.name || 'Unknown office'}</span>
                                        </div>
                                        <div className="employee-metadata mt-0.5 truncate text-[var(--municipal-muted)]">From {item.originOffice?.shortName || item.originOffice?.name || 'Unknown'}</div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="employee-functional-label text-[var(--municipal-muted)] xl:hidden">Assignment</div>
                                        <div className="employee-metadata mt-0.5 truncate font-semibold text-[var(--municipal-text)]">{item.assignedEmployee?.name || 'Unassigned'}</div>
                                        {item.assignedEmployee?.position ? <div className="employee-metadata mt-0.5 line-clamp-2 text-[var(--municipal-muted)]">{item.assignedEmployee.position}</div> : null}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="employee-functional-label text-[var(--municipal-muted)] xl:hidden">Due / activity</div>
                                        <div className="employee-metadata mt-0.5 flex items-center gap-1.5 font-semibold text-[var(--municipal-text)]">
                                            <Clock3 size={12} className="shrink-0 text-[var(--municipal-muted)]" aria-hidden="true" />
                                            {item.dueState === 'completed' ? formatWorkDate(item.completedAt) : formatWorkDate(item.dueAt)}
                                        </div>
                                        <div className="employee-metadata mt-0.5 text-[var(--municipal-muted)]" title={updatedExact}>
                                            Updated {updatedRecency || updatedExact}
                                            {updatedRecency ? <span className="sr-only"> / {updatedExact}</span> : null}
                                        </div>
                                    </div>
                                </div>

                                <div className="employee-supporting-text border-l-2 border-[var(--municipal-border)] pl-2.5 font-semibold text-[var(--municipal-text)]">
                                    <div className="mb-0.5 employee-functional-label text-[var(--municipal-muted)] xl:hidden">Next action</div>
                                    {item.expectedAction}
                                </div>

                                <Link href={withReturnContext(`/transactions/${item.id}`, url, '/transactions')} className="employee-metadata inline-flex min-h-11 items-center justify-center gap-1.5 font-bold text-[var(--municipal-brand)] hover:underline" aria-label={`Open work item ${item.reference}`}>
                                    Open <ArrowRight size={13} aria-hidden="true" />
                                </Link>
                            </div>
                        </article>
                    );
                })}

                {records.data.length === 0 ? <div className="employee-empty-state"><div className="employee-record-title text-[var(--municipal-text)]">No tasks match this view.</div><div className="employee-supporting-text mt-1 text-[var(--municipal-muted)]">Change the queue category or clear one of the active filters.</div></div> : null}
            </div>

            {records.last_page > 1 ? <nav className="employee-panel-header flex items-center justify-between gap-3 border-t border-[var(--municipal-border)]" aria-label="Work queue pagination">
                {records.prev_page_url
                    ? <Link href={records.prev_page_url} preserveScroll className="employee-metadata inline-flex min-h-11 items-center rounded-md px-3 font-semibold text-[var(--municipal-text)] hover:bg-[var(--municipal-hover)]">Previous</Link>
                    : <span aria-disabled="true" className="employee-metadata inline-flex min-h-11 items-center px-3 font-semibold text-[var(--municipal-muted)]">Previous</span>}
                <div className="employee-metadata text-[var(--municipal-muted)]" aria-current="page">Page {records.current_page} of {records.last_page}</div>
                {records.next_page_url
                    ? <Link href={records.next_page_url} preserveScroll className="employee-metadata inline-flex min-h-11 items-center rounded-md px-3 font-semibold text-[var(--municipal-text)] hover:bg-[var(--municipal-hover)]">Next</Link>
                    : <span aria-disabled="true" className="employee-metadata inline-flex min-h-11 items-center px-3 font-semibold text-[var(--municipal-muted)]">Next</span>}
            </nav> : null}
        </section>
    );
}
