import { Building2, FileText, FolderKanban, Landmark, MapPin, ShieldCheck, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { PPARecord } from '../../data/municipal/ppas.types';
import { formatPHP } from '../../lib/format';
import type { PlanningPermissions } from '../../pages/Plans/Index';
import SupportingDocsPanel, { type ServerPlanningAttachment } from '../planning/SupportingDocsPanel';

type Props = {
    record: PPARecord | null;
    onClose: () => void;
    attachments?: ServerPlanningAttachment[];
    planningPermissions?: PlanningPermissions;
};

export default function PPADetailPanel({
    record,
    onClose,
    attachments = [],
    planningPermissions,
}: Props) {
    const panelRef = useRef<HTMLElement>(null);
    useEffect(() => {
        if (!record) return;
        const frame = window.requestAnimationFrame(() => {
            panelRef.current?.focus();
            panelRef.current?.scrollIntoView({ block: 'nearest' });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [record?.id]);
    if (!record) return null;

    const fields = [
        ['Responsible office', record.responsibleOffice, Building2],
        ['Development plan', record.relatedDevelopmentPlan, FileText],
        ['Funding source', record.fundingSource, Landmark],
        ['Related projects', String(record.relatedProjectCount), FolderKanban],
    ] as const;

    const canUploadToPpa = Boolean(
        planningPermissions?.canManagePpas ||
            (planningPermissions?.canProposeOfficePpa &&
                (record.implementingDepartmentId === planningPermissions.actorDepartmentId ||
                    record.responsibleOffice.toLowerCase() ===
                        (planningPermissions.actorDepartmentName ?? '').toLowerCase())),
    );

    return (
        <aside
            id="selected-ppa-detail"
            ref={panelRef}
            tabIndex={-1}
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    onClose();
                }
            }}
            className="municipal-panel ot-r6-ppa-detail r8-ppas-detail min-w-0 p-3"
            aria-label="Selected PPA details"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">
                        {record.id} / {record.year}
                        {record.aipReferenceCode ? ` · AIP ${record.aipReferenceCode}` : ''}
                    </div>
                    <h2 className="mt-0.5 text-base font-bold">{record.title}</h2>
                    <div className="mt-1 text-xs text-[var(--municipal-muted)]">
                        {record.sector} / {record.status} / {record.priority} priority
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30"
                    aria-label="Close details"
                >
                    <X size={17} />
                </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--municipal-muted)]">
                Reference record · Not verified live implementation progress
            </p>
            <p className="mt-2 text-sm leading-5 text-[var(--municipal-text)]">
                {record.implementationContext}
            </p>

            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {fields.map(([label, value, Icon]) => (
                    <div
                        key={label}
                        className="rounded-[var(--municipal-radius-surface)] bg-[var(--municipal-surface-subtle)] p-2.5"
                    >
                        <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">
                            <Icon size={13} aria-hidden="true" />
                            {label}
                        </dt>
                        <dd className="mt-1 text-xs font-semibold leading-5">{value}</dd>
                    </div>
                ))}
            </dl>

            {(record.appropriationAmount !== undefined || record.barangay) && (
                <div className="mt-3 rounded-[var(--municipal-radius-surface)] border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] p-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-1 font-semibold text-[var(--municipal-text)]">
                            <MapPin size={13} aria-hidden="true" />
                            {record.barangay ?? 'Poblacion'}, {record.location ?? 'Talibon'}
                        </span>
                        {record.targetQuarter && (
                            <span className="text-[11px] text-[var(--municipal-muted)]">
                                Target: {record.targetQuarter}
                            </span>
                        )}
                    </div>
                    {record.appropriationAmount !== undefined && (
                        <dl className="mt-2 grid grid-cols-2 gap-2 border-t border-[var(--municipal-border)] pt-2 text-[11px] sm:grid-cols-4">
                            <div>
                                <dt className="text-[var(--municipal-muted)]">Total AIP</dt>
                                <dd className="font-bold text-[var(--municipal-text)]">
                                    {formatPHP(record.appropriationAmount)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[var(--municipal-muted)]">MOOE</dt>
                                <dd className="font-semibold text-[var(--municipal-text)]">
                                    {formatPHP(record.mooeAmount ?? 0)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[var(--municipal-muted)]">Capital Outlay</dt>
                                <dd className="font-semibold text-[var(--municipal-text)]">
                                    {formatPHP(record.coAmount ?? 0)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[var(--municipal-muted)]">Tagging</dt>
                                <dd className="flex flex-wrap gap-1 font-semibold text-[var(--municipal-text)]">
                                    {record.gadAttributed && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px]">
                                            <ShieldCheck size={11} /> GAD
                                        </span>
                                    )}
                                    {record.drrmTagged && (
                                        <span className="text-[10px]">DRRM</span>
                                    )}
                                    {!record.gadAttributed && !record.drrmTagged && 'Standard'}
                                </dd>
                            </div>
                        </dl>
                    )}
                </div>
            )}

            <SupportingDocsPanel
                parentType="ppa"
                parentCode={record.id}
                attachments={attachments}
                canUpload={canUploadToPpa}
                canManageExecutive={Boolean(planningPermissions?.canViewExecutiveAttachments)}
                canDelete={Boolean(planningPermissions?.isMpdcHead)}
            />
        </aside>
    );
}
