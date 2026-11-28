import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    BriefcaseBusiness,
    FileText,
    HeartPulse,
    IdCard,
    LockKeyhole,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import { StatusBadge, toneForWorkState } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../lib/format';

type Employee = {
    id: number;
    employee_number: string;
    full_name?: string | null;
    work_email?: string | null;
    position_title: string;
    employment_status: string;
    department: { id: number; code: string; name: string; short_name?: string | null };
    supervisor?: { id: number; employee_number: string; full_name?: string | null; position_title: string } | null;
};

type EmploymentProfile = {
    employment_type?: string | null;
    appointment_date?: string | null;
    employment_start_date?: string | null;
    contract_end_date?: string | null;
    biometric_external_id?: string | null;
};
type PrivateProfile = {
    date_of_birth?: string | null;
    personal_email?: string | null;
    mobile_number?: string | null;
    home_address?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_relationship?: string | null;
    emergency_contact_phone?: string | null;
    government_ids: { gsis?: string | null; philhealth?: string | null; pagibig?: string | null; tin?: string | null };
};
type Document = {
    id: number;
    public_id: string;
    title: string;
    document_type: string;
    classification: string;
    retention_code?: string | null;
    created_at?: string | null;
};
type Assignment = { id: number; reference_no: string; title: string; priority: string; status: string; due_at?: string | null };
type Performance = {
    id: number;
    period_start: string;
    period_end: string;
    rating?: string | null;
    rating_scale?: string | null;
    status: string;
    summary?: string | null;
    reviewed_at?: string | null;
};
type Development = {
    id: number;
    record_type: string;
    title: string;
    provider?: string | null;
    reference_no?: string | null;
    attained_at?: string | null;
    expires_at?: string | null;
    status: string;
};

type Props = {
    employee: Employee;
    employmentProfile: EmploymentProfile | null;
    privateProfile: PrivateProfile | null;
    documents: Document[];
    activeAssignments: Assignment[];
    performanceRecords: Performance[];
    developmentRecords: Development[];
    permissions: {
        isSelf: boolean;
        canViewPrivate: boolean;
        canViewHrRecord: boolean;
        canViewWorkContext: boolean;
        healthVaultAccess: boolean;
        canManageHealthAccess: boolean;
    };
};

const valueOrDash = (input?: string | null) => input || 'Not recorded';

function RestrictedNote({ text }: { text: string }) {
    return (
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5 text-xs leading-5 text-[var(--ink-secondary)]">
            <LockKeyhole size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-secondary)]" />
            <span>{text}</span>
        </div>
    );
}

export default function Show({
    employee,
    employmentProfile,
    privateProfile,
    documents,
    activeAssignments,
    performanceRecords,
    developmentRecords,
    permissions,
}: Props) {
    return (
        <AppLayout title={employee.full_name || 'Employee Profile'}>
            <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-4 sm:px-6">
                <Link
                    href="/employees"
                    className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-[var(--brand-ink)] hover:underline"
                >
                    <ArrowLeft size={15} aria-hidden="true" />
                    <span>Back to Employee Directory</span>
                </Link>

                {/* Compact TCDS identity header */}
                <section className="tcds-card p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3.5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                                <UserRound size={22} aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                    {employee.employee_number}
                                </div>
                                <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-[var(--ink-primary)] sm:text-2xl">
                                    {employee.full_name || 'Employee'}
                                </h1>
                                <p className="mt-0.5 text-sm text-[var(--ink-secondary)]">
                                    {employee.position_title} · {employee.department.short_name || employee.department.name}
                                </p>
                            </div>
                        </div>
                        <StatusBadge tone={employee.employment_status === 'active' ? 'ok' : 'neutral'}>
                            {humanizeSlug(employee.employment_status)}
                        </StatusBadge>
                    </div>

                    <dl className="mt-4 grid gap-3 border-t border-[var(--border-default)] pt-3.5 text-sm sm:grid-cols-3">
                        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3.5 py-2.5">
                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Work email</dt>
                            <dd className="mt-0.5 break-all font-semibold text-[var(--ink-primary)]">{valueOrDash(employee.work_email)}</dd>
                        </div>
                        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3.5 py-2.5">
                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Office</dt>
                            <dd className="mt-0.5 font-semibold text-[var(--ink-primary)]">{employee.department.name}</dd>
                        </div>
                        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3.5 py-2.5">
                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Supervisor</dt>
                            <dd className="mt-0.5 font-semibold text-[var(--ink-primary)]">{employee.supervisor?.full_name || 'Not assigned'}</dd>
                        </div>
                    </dl>
                </section>

                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="tcds-card p-4 sm:p-5">
                        <div className="flex items-center gap-2">
                            <BriefcaseBusiness size={17} aria-hidden="true" className="text-[var(--brand-ink)]" />
                            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Employment record</h2>
                        </div>
                        {employmentProfile ? (
                            <dl className="mt-3.5 grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Employment type</dt>
                                    <dd className="mt-0.5 text-sm font-semibold text-[var(--ink-primary)]">{humanizeSlug(employmentProfile.employment_type)}</dd>
                                </div>
                                <div>
                                    <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Appointment date</dt>
                                    <dd className="mt-0.5 text-sm font-semibold text-[var(--ink-primary)]">{employmentProfile.appointment_date ? formatDatePH(employmentProfile.appointment_date) : 'Not recorded'}</dd>
                                </div>
                                <div>
                                    <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Start date</dt>
                                    <dd className="mt-0.5 text-sm font-semibold text-[var(--ink-primary)]">{employmentProfile.employment_start_date ? formatDatePH(employmentProfile.employment_start_date) : 'Not recorded'}</dd>
                                </div>
                                <div>
                                    <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Contract end</dt>
                                    <dd className="mt-0.5 text-sm font-semibold text-[var(--ink-primary)]">{employmentProfile.contract_end_date ? formatDatePH(employmentProfile.contract_end_date) : '—'}</dd>
                                </div>
                                <div className="col-span-2">
                                    <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Biometric reference</dt>
                                    <dd className="mt-0.5 font-mono text-xs font-semibold text-[var(--ink-primary)]">{valueOrDash(employmentProfile.biometric_external_id)}</dd>
                                </div>
                            </dl>
                        ) : (
                            <RestrictedNote text="Employment-record details are restricted to the employee and authorized HR personnel." />
                        )}
                    </section>

                    <section className="tcds-card p-4 sm:p-5">
                        <div className="flex items-center gap-2">
                            <IdCard size={17} aria-hidden="true" className="text-[var(--brand-ink)]" />
                            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Private profile</h2>
                        </div>
                        {privateProfile ? (
                            <dl className="mt-3.5 space-y-3 text-xs">
                                <div>
                                    <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Personal contact</dt>
                                    <dd className="mt-0.5 text-sm font-semibold text-[var(--ink-primary)]">
                                        {valueOrDash(privateProfile.personal_email)} · {valueOrDash(privateProfile.mobile_number)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Home address</dt>
                                    <dd className="mt-0.5 text-sm font-semibold text-[var(--ink-primary)]">{valueOrDash(privateProfile.home_address)}</dd>
                                </div>
                                <div>
                                    <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Emergency contact</dt>
                                    <dd className="mt-0.5 text-sm font-semibold text-[var(--ink-primary)]">
                                        {valueOrDash(privateProfile.emergency_contact_name)} · {valueOrDash(privateProfile.emergency_contact_relationship)} · {valueOrDash(privateProfile.emergency_contact_phone)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Government identifiers</dt>
                                    <dd className="mt-1 grid grid-cols-2 gap-1.5 font-mono text-xs text-[var(--ink-primary)]">
                                        <span>GSIS: {valueOrDash(privateProfile.government_ids.gsis)}</span>
                                        <span>PhilHealth: {valueOrDash(privateProfile.government_ids.philhealth)}</span>
                                        <span>Pag-IBIG: {valueOrDash(privateProfile.government_ids.pagibig)}</span>
                                        <span>TIN: {valueOrDash(privateProfile.government_ids.tin)}</span>
                                    </dd>
                                </div>
                            </dl>
                        ) : (
                            <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5 text-xs leading-5 text-[var(--ink-secondary)]">
                                <ShieldCheck size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-secondary)]" />
                                <span>Private contact and government identifiers are not part of the ordinary directory view.</span>
                            </div>
                        )}
                    </section>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="tcds-card p-4 sm:p-5">
                        <div className="flex items-center gap-2">
                            <Award size={17} aria-hidden="true" className="text-[var(--brand-ink)]" />
                            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Performance &amp; development</h2>
                        </div>
                        {permissions.canViewHrRecord ? (
                            <div className="mt-3.5 space-y-3.5">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Performance records</div>
                                    <div className="mt-2 space-y-2">
                                        {performanceRecords.map((record) => (
                                            <div key={record.id} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3.5 py-2.5">
                                                <div className="text-xs font-semibold text-[var(--ink-primary)]">
                                                    {formatDatePH(record.period_start)} – {formatDatePH(record.period_end)}
                                                </div>
                                                <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                    {record.rating ? `Rating ${record.rating}${record.rating_scale ? ` · ${record.rating_scale}` : ''}` : 'No numeric rating'} · {humanizeSlug(record.status)}
                                                </div>
                                                {record.summary && <div className="mt-1.5 text-xs text-[var(--ink-secondary)]">{record.summary}</div>}
                                            </div>
                                        ))}
                                        {performanceRecords.length === 0 && (
                                            <div className="rounded-lg bg-[var(--surface-recessed)] p-3 text-xs text-[var(--ink-secondary)]">No performance record yet.</div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Training &amp; eligibility</div>
                                    <div className="mt-2 space-y-2">
                                        {developmentRecords.map((record) => (
                                            <div key={record.id} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3.5 py-2.5">
                                                <div className="text-xs font-bold uppercase text-[var(--brand-ink)]">
                                                    {humanizeSlug(record.record_type)}
                                                </div>
                                                <div className="mt-0.5 text-sm font-semibold text-[var(--ink-primary)]">{record.title}</div>
                                                <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                    {record.provider || 'Provider not recorded'}
                                                    {record.expires_at ? ` · expires ${formatDatePH(record.expires_at)}` : ''}
                                                </div>
                                            </div>
                                        ))}
                                        {developmentRecords.length === 0 && (
                                            <div className="rounded-lg bg-[var(--surface-recessed)] p-3 text-xs text-[var(--ink-secondary)]">No development or eligibility record yet.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <RestrictedNote text="Performance and development history is restricted to authorized HR personnel." />
                        )}
                    </section>

                    <section className="tcds-card border-l-4 border-l-[var(--status-danger-bar)] p-4 sm:p-5">
                        <div className="flex items-center gap-2">
                            <HeartPulse size={17} aria-hidden="true" className="text-[var(--status-danger-fg)]" />
                            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Restricted employee health vault</h2>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[var(--ink-secondary)]">
                            Employment and occupational-health records require an explicit access grant separate from normal HR or system-administration privileges. RHU clinical patient history remains outside this system.
                        </p>
                        {permissions.healthVaultAccess ? (
                            <Link href={`/hris/health/${employee.id}`} className="municipal-primary-button mt-3.5">
                                Open restricted vault
                            </Link>
                        ) : (
                            <div className="mt-3 rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3.5 py-2.5 text-xs font-semibold text-[var(--status-danger-fg)]">
                                No active explicit vault grant for this account.
                            </div>
                        )}
                        {permissions.canManageHealthAccess && (
                            <Link
                                href="/hris/health-access"
                                className="mt-3 inline-block text-xs font-semibold text-[var(--brand-ink)] underline"
                            >
                                Manage explicit access policy →
                            </Link>
                        )}
                    </section>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="tcds-card p-4 sm:p-5">
                        <div className="flex items-center gap-2">
                            <FileText size={17} aria-hidden="true" className="text-[var(--brand-ink)]" />
                            <h2 className="text-sm font-bold text-[var(--ink-primary)]">201-file document foundation</h2>
                        </div>
                        {permissions.canViewHrRecord ? (
                            <div className="mt-3 space-y-2">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3.5 py-2.5">
                                        <div className="text-sm font-semibold text-[var(--ink-primary)]">{doc.title}</div>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            <StatusBadge tone="neutral">{humanizeSlug(doc.document_type)}</StatusBadge>
                                            <StatusBadge tone="warn">{humanizeSlug(doc.classification)}</StatusBadge>
                                        </div>
                                    </div>
                                ))}
                                {documents.length === 0 && (
                                    <div className="rounded-lg bg-[var(--surface-recessed)] p-3.5 text-xs text-[var(--ink-secondary)]">
                                        No employee-linked document records yet.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <RestrictedNote text="201-file records are restricted to the employee and authorized HR personnel." />
                        )}
                    </section>

                    <section className="tcds-card p-4 sm:p-5">
                        <div className="flex items-center gap-2">
                            <BriefcaseBusiness size={17} aria-hidden="true" className="text-[var(--brand-ink)]" />
                            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Active assigned work</h2>
                        </div>
                        {permissions.canViewWorkContext ? (
                            <div className="mt-3 space-y-2">
                                {activeAssignments.map((assignment) => (
                                    <Link
                                        key={assignment.id}
                                        href={`/transactions/${assignment.id}`}
                                        className="block rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3.5 py-3 transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--surface-hover)]"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-mono text-xs font-bold text-[var(--brand-ink)]">
                                                {assignment.reference_no}
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                <StatusBadge tone={toneForWorkState(assignment.priority)}>
                                                    {humanizeSlug(assignment.priority)}
                                                </StatusBadge>
                                                <StatusBadge tone={toneForWorkState(assignment.status)}>
                                                    {humanizeSlug(assignment.status)}
                                                </StatusBadge>
                                            </div>
                                        </div>
                                        <div className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">{assignment.title}</div>
                                        {assignment.due_at && (
                                            <div className="mt-1 text-xs text-[var(--ink-secondary)]">Due {formatDatePH(assignment.due_at)}</div>
                                        )}
                                    </Link>
                                ))}
                                {activeAssignments.length === 0 && (
                                    <div className="rounded-lg bg-[var(--surface-recessed)] p-3.5 text-xs text-[var(--ink-secondary)]">
                                        No active assignments visible.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <RestrictedNote text="Work context is limited to the employee, authorized office leadership, HR, and executive oversight." />
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
