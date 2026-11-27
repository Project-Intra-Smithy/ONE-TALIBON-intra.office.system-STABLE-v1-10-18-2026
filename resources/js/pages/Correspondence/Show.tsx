import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Building2, CalendarClock, FileText, GitBranch, UserRound } from 'lucide-react';
import CorrespondenceActionPanel, {
    type CorrespondenceCapabilities,
    type CorrespondenceRouteOption,
} from '../../components/correspondence/CorrespondenceActionPanel';
import EvidenceList, { type EvidenceItem, type EvidencePayload } from '../../components/documents/EvidenceList';
import { StatusBadge, toneForWorkState } from '../../components/ui';
import RelatedWorkPanel from '../../components/workflow/RelatedWorkPanel';
import AppLayout from '../../layouts/AppLayout';
import { formatDateTimePH, humanizeSlug } from '../../lib/format';
import { returnTargetFromDetailUrl } from '../../navigation/returnContext';

type Office = { code: string; name: string; shortName?: string | null };
type Employee = { employeeNumber: string; name: string; position?: string | null };
type Workflow = {
    reference: string;
    status: string;
    currentOffice?: Office | null;
    assignedEmployee?: Employee | null;
    detailUrl?: string | null;
};
type TimelineEvent = {
    id: string;
    source: 'correspondence' | 'workflow';
    event: string;
    previousState?: string | null;
    newState: string;
    actor?: { type: 'human' | 'integration'; name: string } | null;
    office?: Office | null;
    fromOffice?: Office | null;
    toOffice?: Office | null;
    remarks?: string | null;
    occurredAt?: string | null;
    evidence: EvidenceItem[];
};
type Props = {
    correspondence: {
        publicId: string;
        reference: string;
        municipalReference?: string | null;
        externalReference: string;
        lifecycleState: string;
        classification?: string | null;
        source: {
            senderName: string;
            senderOrganization?: string | null;
            source: string;
            channel?: string | null;
        };
        content: { subject: string; summary?: string | null };
        accountability: {
            currentOffice?: Office | null;
            receivingOffice?: Office | null;
            workflow?: Workflow | null;
        };
        dates: {
            receivedAt?: string | null;
            registeredAt?: string | null;
            classifiedAt?: string | null;
            routedAt?: string | null;
            actionStartedAt?: string | null;
        };
    };
    timeline: TimelineEvent[];
    capabilities: CorrespondenceCapabilities;
    routeOptions: CorrespondenceRouteOption[];
    evidence: EvidencePayload;
};

const officeLabel = (office?: Office | null) => office?.shortName || office?.name || '—';

function DetailRow({ label, value }: { label: string; value?: string | null }) {
    const empty = !value || value === '—';
    return (
        <div className="grid gap-1 border-b border-[var(--border-default)] py-2 last:border-b-0 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-3">
            <div className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">{label}</div>
            <div className={`text-xs font-semibold sm:text-sm ${empty ? 'font-normal text-[var(--ink-secondary)] opacity-70' : 'text-[var(--ink-primary)]'}`}>
                {value || '—'}
            </div>
        </div>
    );
}

export default function CorrespondenceShow({ correspondence, timeline, capabilities, routeOptions, evidence }: Props) {
    const { url } = usePage();
    const returnTarget = returnTargetFromDetailUrl(url, '/correspondence');
    const workflow = correspondence.accountability.workflow;
    const currentOffice = correspondence.accountability.currentOffice;
    const receivingOffice = correspondence.accountability.receivingOffice;
    const hasActions = capabilities.canRegister || capabilities.canClassify || capabilities.canRoute || capabilities.canAct;

    const relatedWork = [
        { label: 'Back to Inbox & Routing', detail: 'Return to the authorized Correspondence queue.', href: returnTarget },
        ...(workflow?.detailUrl
            ? [{ label: `Linked workflow ${workflow.reference}`, detail: `${humanizeSlug(workflow.status)} · ${officeLabel(workflow.currentOffice)}`, href: workflow.detailUrl }]
            : []),
        { label: 'Search reference in Records', detail: 'Locate related municipal records using this exact reference.', href: `/records?search=${encodeURIComponent(correspondence.reference)}` },
        { label: 'Open Work Queue', detail: 'Move to inter-office work requiring your action.', href: '/transactions?view=needs_my_action' },
    ];

    return (
        <AppLayout title={`Correspondence · ${correspondence.reference}`}>
            <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                        href={returnTarget}
                        className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-[var(--brand-ink)] hover:underline"
                    >
                        <ArrowLeft size={15} aria-hidden="true" />
                        <span>Back to Inbox &amp; Routing</span>
                    </Link>
                    <span className="text-xs font-medium text-[var(--ink-secondary)]">Correspondence review workspace</span>
                </div>

                {/* Compact TCDS header card */}
                <section className="tcds-card p-4 sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                    Municipal correspondence
                                </span>
                                <span className="text-[var(--ink-secondary)]">· {officeLabel(currentOffice)}</span>
                            </div>
                            <h1 className="mt-1 break-words font-mono text-xl font-extrabold text-[var(--ink-primary)] sm:text-2xl">
                                {correspondence.reference}
                            </h1>
                            <p className="mt-1 max-w-4xl text-sm font-semibold leading-5 text-[var(--ink-primary)]">
                                {correspondence.content.subject}
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                            <StatusBadge tone={toneForWorkState(correspondence.lifecycleState)}>
                                {humanizeSlug(correspondence.lifecycleState)}
                            </StatusBadge>
                            {correspondence.classification && (
                                <StatusBadge tone={correspondence.classification === 'restricted' ? 'danger' : correspondence.classification === 'confidential' ? 'warn' : 'neutral'}>
                                    {humanizeSlug(correspondence.classification)}
                                </StatusBadge>
                            )}
                        </div>
                    </div>
                </section>

                {hasActions && (
                    <CorrespondenceActionPanel
                        publicId={correspondence.publicId}
                        lifecycleState={correspondence.lifecycleState}
                        capabilities={capabilities}
                        routeOptions={routeOptions}
                        linkedWorkflowUrl={workflow?.detailUrl}
                    />
                )}

                {/* 2-Column Content Grid — Correspondence Details & Timeline immediately above the fold */}
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_340px] lg:items-start">
                    <div className="min-w-0 space-y-4">
                        <section className="tcds-card p-4 sm:p-5">
                            <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink-primary)]">
                                <FileText size={16} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                <span>Correspondence details</span>
                            </div>
                            <div className="mt-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3">
                                <div className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Summary</div>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--ink-primary)]">
                                    {correspondence.content.summary || 'No summary recorded.'}
                                </p>
                            </div>
                            <div className="mt-2">
                                <DetailRow label="Sender" value={correspondence.source.senderName} />
                                <DetailRow label="Organization" value={correspondence.source.senderOrganization || '—'} />
                                <DetailRow label="Source" value={humanizeSlug(correspondence.source.source)} />
                                <DetailRow label="Channel" value={correspondence.source.channel ? humanizeSlug(correspondence.source.channel) : '—'} />
                            </div>
                        </section>

                        {evidence.record.length > 0 && (
                            <section className="tcds-card p-4 sm:p-5">
                                <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink-primary)]">
                                    <FileText size={16} aria-hidden="true" />
                                    <span>Record evidence</span>
                                </div>
                                <div className="mt-3"><EvidenceList items={evidence.record} /></div>
                            </section>
                        )}

                        <section className="tcds-card p-4 sm:p-5">
                            <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink-primary)]">
                                <CalendarClock size={16} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                <span>Routing &amp; lifecycle trace</span>
                            </div>
                            <div className="mt-4 space-y-0">
                                {timeline.map((event, index) => (
                                    <div key={event.id} className="relative pb-4 pl-7 last:pb-0">
                                        {index < timeline.length - 1 && (
                                            <div className="absolute left-[6px] top-3 h-full w-px bg-[var(--border-default)]" />
                                        )}
                                        <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--surface-card)] bg-[var(--brand-primary)] ring-1 ring-[var(--brand-soft-border)]" />
                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                            <div>
                                                <div className="text-sm font-bold text-[var(--ink-primary)]">
                                                    {humanizeSlug(event.event)}
                                                    {event.source === 'workflow' && (
                                                        <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-[var(--brand-ink)]">
                                                            Workflow
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                    {event.previousState ? `${humanizeSlug(event.previousState)} → ` : ''}
                                                    {humanizeSlug(event.newState)}
                                                </div>
                                            </div>
                                            <time className="shrink-0 whitespace-nowrap text-xs text-[var(--ink-secondary)]">
                                                {event.occurredAt ? formatDateTimePH(event.occurredAt) : '—'}
                                            </time>
                                        </div>
                                        {(event.fromOffice || event.toOffice) && (
                                            <div className="mt-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3 py-1.5 text-xs text-[var(--ink-secondary)]">
                                                <span className="font-semibold text-[var(--ink-primary)]">Movement:</span> {officeLabel(event.fromOffice)} → {officeLabel(event.toOffice)}
                                            </div>
                                        )}
                                        <div className="mt-1.5 text-xs text-[var(--ink-secondary)]">
                                            <span className="font-semibold text-[var(--ink-primary)]">{event.actor?.name || 'System event'}</span>
                                            {event.office && <span> · {event.office.shortName || event.office.name}</span>}
                                        </div>
                                        {event.remarks && (
                                            <p className="mt-2 rounded-lg bg-[var(--surface-recessed)] px-3 py-2 text-xs leading-5 text-[var(--ink-secondary)]">
                                                {event.remarks}
                                            </p>
                                        )}
                                        <EvidenceList items={event.evidence ?? []} compact />
                                    </div>
                                ))}
                                {timeline.length === 0 && (
                                    <div className="py-6 text-center text-xs text-[var(--ink-secondary)]">No routing or lifecycle events recorded yet.</div>
                                )}
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-4">
                        <section className="tcds-card p-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                <UserRound size={15} aria-hidden="true" />
                                <span>Current accountability</span>
                            </div>
                            <div className="mt-2">
                                <DetailRow label="Receiving office" value={officeLabel(receivingOffice)} />
                                <DetailRow label="Current office" value={officeLabel(currentOffice)} />
                                <DetailRow label="Workflow ref" value={workflow?.reference || '—'} />
                                <DetailRow label="Workflow status" value={workflow ? humanizeSlug(workflow.status) : '—'} />
                                <DetailRow label="Assignee" value={workflow?.assignedEmployee?.name || 'Unassigned'} />
                            </div>
                            {workflow?.detailUrl && (
                                <Link href={workflow.detailUrl} className="municipal-secondary-button mt-3 w-full">
                                    <GitBranch size={14} aria-hidden="true" />
                                    <span>Open linked workflow</span>
                                </Link>
                            )}
                        </section>

                        <section className="tcds-card p-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                <Building2 size={15} aria-hidden="true" />
                                <span>Record identity &amp; dates</span>
                            </div>
                            <div className="mt-2">
                                <DetailRow label="Municipal ref" value={correspondence.municipalReference} />
                                <DetailRow label="External ref" value={correspondence.externalReference} />
                                <DetailRow label="Received" value={correspondence.dates.receivedAt ? formatDateTimePH(correspondence.dates.receivedAt) : '—'} />
                                <DetailRow label="Registered" value={correspondence.dates.registeredAt ? formatDateTimePH(correspondence.dates.registeredAt) : '—'} />
                                {correspondence.dates.classifiedAt && <DetailRow label="Classified" value={formatDateTimePH(correspondence.dates.classifiedAt)} />}
                                {correspondence.dates.routedAt && <DetailRow label="Routed" value={formatDateTimePH(correspondence.dates.routedAt)} />}
                                {correspondence.dates.actionStartedAt && <DetailRow label="Action started" value={formatDateTimePH(correspondence.dates.actionStartedAt)} />}
                            </div>
                        </section>

                        <RelatedWorkPanel items={relatedWork} />
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
