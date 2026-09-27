import { Users } from 'lucide-react';
import type { StaffWorkload } from './types';

export default function StaffWorkloadTable({ rows }: { rows: StaffWorkload[] }) {
    return (
        <section className="municipal-panel overflow-hidden" aria-labelledby="my-work-staff-workload">
            <div className="employee-panel-header flex items-center gap-2 border-b border-[var(--municipal-border)]">
                <Users size={16} className="text-[var(--municipal-brand)]" aria-hidden="true" />
                <h2 id="my-work-staff-workload" className="employee-section-title">Bounded staff workload</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead className="employee-table-heading bg-[var(--municipal-surface-subtle)] text-[var(--municipal-muted)]">
                        <tr>
                            <th scope="col" className="employee-subsection-bar border-b border-[var(--municipal-border)]">Employee</th>
                            <th scope="col" className="employee-subsection-bar border-b border-[var(--municipal-border)]">Active</th>
                            <th scope="col" className="employee-subsection-bar border-b border-[var(--municipal-border)]">Overdue</th>
                            <th scope="col" className="employee-subsection-bar border-b border-[var(--municipal-border)]">Requires action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--municipal-border)]">
                        {rows.map((row) => (
                            <tr key={`${row.employee}-${row.position || ''}`} className="hover:bg-[var(--municipal-hover)]">
                                <th scope="row" className="employee-record-row font-normal">
                                    <div className="employee-record-title">{row.employee}</div>
                                    <div className="employee-metadata mt-0.5 text-[var(--municipal-muted)]">{row.position || 'Position not recorded'}</div>
                                </th>
                                <td className="employee-record-row employee-metadata text-[var(--municipal-muted)]"><span className="font-bold tabular-nums text-[var(--municipal-text)]">{row.active}</span> active</td>
                                <td className="employee-record-row employee-metadata text-[var(--municipal-muted)]"><span className={row.overdue > 0 ? 'employee-tone-danger font-bold tabular-nums' : 'font-bold tabular-nums text-[var(--municipal-text)]'}>{row.overdue}</span> overdue</td>
                                <td className="employee-record-row employee-metadata text-[var(--municipal-muted)]"><span className="employee-tone-info font-bold tabular-nums">{row.requiresAction}</span> items</td>
                            </tr>
                        ))}
                        {rows.length === 0 ? <tr><td colSpan={4} className="employee-empty-state employee-body-text text-[var(--municipal-muted)]">No active assigned office work.</td></tr> : null}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
