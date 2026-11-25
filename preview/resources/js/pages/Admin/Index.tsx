import { Link, router, useForm } from '@inertiajs/react';
import { Activity, Ban, Building2, Copy, KeyRound, LockKeyhole, RotateCcw, Search, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';
import { type ChangeEvent, type FormEvent, type ReactNode, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import { ConfirmDialog } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDateTimePH } from '../../lib/format';

function decodePaginationLabel(raw: string): string {
    return raw
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, '')
        .trim();
}

type Overview = { totalEmployees:number; portalUsers:number; activeUsers:number; inactiveUsers:number; employeesWithoutPortalAccounts:number; activeDepartments:number; privilegedUsers:number; mfaEnrolled:number };
type Department = { id:number; code:string; name:string; shortName:string|null };
type RegistryRow = { id:number; employee:string|null; employeeNumber:string|null; department:Omit<Department,'id'>|null; position:string|null; role:string|null; username:string|null; loginEmail:string|null; accountStatus:string; active:boolean; mfaEnrolled:boolean };
type EligibleEmployee = { id:number; name:string; employeeNumber:string|null; office:string|null; departmentId:number };
type PendingInvitation = { id:number; employee:string|null; username:string; role:string; office:string|null; expiresAt:string; expired:boolean };
type ActivationCredential = { code:string; username:string; expiresAt:string }|null;
type PageLink = { url:string|null; label:string; active:boolean };
type Registry = { data:RegistryRow[]; total:number; current_page:number; last_page:number; per_page:number; links:PageLink[] };
type OfficeIdentity = { office:string; code:string; shortName:string|null; officialEmail:string|null; status:string };
type OperationSummary = { activeMunicipalWork?:number; municipalOverdue?:number; municipalUnassigned?:number; dueSoon?:number; executiveQueue?:number; completedThisMonth?:number };
type DepartmentWorkload = { id:number; code:string; name:string; shortName:string|null; active:number; unassigned:number; dueSoon:number; overdue:number };
type SecurityEvent = { actor:string|null; action:string; outcome:string; summary:string; createdAt:string|null };
type Security = { privilegedAccounts:number; mfaEnrolled:number; inactiveAccounts:number; recentEvents:SecurityEvent[] };
type Filters = { search:string; department_id:string; role:string; status:string };
type Props = { overview:Overview; registry:Registry; registryFilters:{search:string;department_id:number|null;role:string;status:string}; departmentOptions:Department[]; roleOptions:string[]; invitableRoles:string[]; eligibleEmployees:EligibleEmployee[]; pendingInvitations:PendingInvitation[]; activationCredential:ActivationCredential; officeIdentities:OfficeIdentity[]; operations:{summary:OperationSummary;departmentWorkload:DepartmentWorkload[]}; security:Security };

const label = (value:string) => value.replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase());
const fieldClass = 'tcds-input';
const insetSurface = 'border-[var(--border-default)] bg-[var(--surface-card)]';

export default function AdminIndex({ overview, registry, registryFilters, departmentOptions, roleOptions, invitableRoles, eligibleEmployees, pendingInvitations, activationCredential, officeIdentities, operations, security }:Props) {
    const { data,setData,get,processing } = useForm<Filters>({ search:registryFilters.search??'', department_id:registryFilters.department_id?.toString()??'', role:registryFilters.role??'', status:registryFilters.status??'' });
    const applyFilters=(event:FormEvent)=>{event.preventDefault();get('/admin',{preserveScroll:true,preserveState:true,replace:true});};
    const clearFilters=()=>router.get('/admin',{}, {preserveScroll:true,replace:true});
    const overviewCards=[['Portal users',overview.portalUsers],['Active accounts',overview.activeUsers],['Inactive accounts',overview.inactiveUsers],['MFA enrolled',overview.mfaEnrolled],['Employees',overview.totalEmployees],['Without portal account',overview.employeesWithoutPortalAccounts],['Active offices',overview.activeDepartments],['Privileged accounts',overview.privilegedUsers]] as const;
    const operationCards=[['Active municipal work',operations.summary.activeMunicipalWork??0],['Overdue',operations.summary.municipalOverdue??0],['Unassigned',operations.summary.municipalUnassigned??0],['Completed this month',operations.summary.completedThisMonth??0]] as const;
    const create = useForm({ employee_id:'', username:'', contact_email:'', role:'employee' });
    const submitAccount=(event:FormEvent)=>{event.preventDefault();create.post('/admin/accounts',{preserveScroll:true,onSuccess:()=>create.reset()});};

    return <AppLayout title="Accounts & Access"><PageFrame>
        <PageHeader eyebrow="System administration" title="Accounts & Access" description="Review portal identities, role assignment, account state, MFA enrollment, office digital identity, and authorized security metadata. Administrative access does not expand access to confidential municipal content." icon={ShieldCheck} />

        {activationCredential&&<section role="status" className="mb-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"><div className="flex items-start gap-3"><KeyRound className="mt-0.5 shrink-0" size={20}/><div className="min-w-0"><h2 className="font-bold">Private activation code — shown once</h2><p className="mt-1 text-sm">Give this code privately to <strong>{activationCredential.username}</strong>. It expires {formatDateTimePH(activationCredential.expiresAt)}.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"><code className="break-all rounded-lg bg-white px-3 py-2 font-mono text-sm font-bold tracking-wider text-slate-950 dark:bg-[var(--surface-recessed)] dark:text-white">{activationCredential.code}</code><button type="button" onClick={()=>navigator.clipboard.writeText(activationCredential.code)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-400 px-3 text-sm font-semibold"><Copy size={15}/>Copy once</button></div></div></div></section>}

        <div className="grid gap-4 xl:grid-cols-2">
            <Section title="Add user" icon={<UserPlus size={17}/>} description="Bind an eligible employee to a username and permitted portal role, then generate a private one-time activation code.">
                <form onSubmit={submitAccount} className="grid gap-3 sm:grid-cols-2">
                    <Filter label="Eligible employee" value={create.data.employee_id} onChange={value=>create.setData('employee_id',value)}><option value="">Select employee</option>{eligibleEmployees.map(employee=><option key={employee.id} value={employee.id}>{employee.name} · {employee.office||'No office'}</option>)}</Filter>
                    <Filter label="Portal role" value={create.data.role} onChange={value=>create.setData('role',value)}>{invitableRoles.map(role=><option key={role} value={role}>{label(role)}</option>)}</Filter>
                    <label className="text-xs font-semibold text-[var(--ink-secondary)]">Portal username<input value={create.data.username} onChange={e=>create.setData('username',e.target.value)} className={`mt-1.5 ${fieldClass}`} pattern="[A-Za-z][A-Za-z0-9._-]{2,63}" required autoComplete="off"/></label>
                    <label className="text-xs font-semibold text-[var(--ink-secondary)]">Contact email (optional)<input value={create.data.contact_email} onChange={e=>create.setData('contact_email',e.target.value)} className={`mt-1.5 ${fieldClass}`} type="email" autoComplete="off"/></label>
                    <div className="sm:col-span-2">{Object.values(create.errors).map(error=><p key={error} role="alert" className="mb-1 text-xs font-semibold text-[var(--status-danger-fg)]">{error}</p>)}<button disabled={create.processing} className="municipal-primary-button disabled:opacity-60"><KeyRound size={16}/>Generate activation code</button></div>
                </form>
            </Section>
            <Section title="Pending activations" icon={<KeyRound size={17}/>} description="Track, revoke, or reissue codes. Stored records contain only a keyed digest, never the private code.">
                <div className="divide-y divide-[var(--border-default)] rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)]">{pendingInvitations.length===0?<p className="p-5 text-sm text-[var(--ink-secondary)]">No pending activations.</p>:pendingInvitations.map(invitation=><article key={invitation.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-[var(--ink-primary)]">{invitation.employee||invitation.username}</h3><p className="text-xs text-[var(--ink-secondary)]">@{invitation.username} · {label(invitation.role)} · {invitation.office}</p><p className={`mt-1 text-xs ${invitation.expired?'font-semibold text-[var(--status-danger-fg)]':'text-[var(--ink-secondary)]'}`}>{invitation.expired?'Expired':'Expires'} {formatDateTimePH(invitation.expiresAt)}</p></div><button type="button" onClick={()=>router.post(`/admin/invitations/${invitation.id}/revoke`,{reason:'administrator revoked'})} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 text-xs font-semibold text-[var(--status-danger-fg)]"><Ban size={14}/>Revoke</button></article>)}</div>
            </Section>
        </div>

        <Section title="Access summary" icon={<Users size={17}/>} description="Current account and identity totals from the portal registry.">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">{overviewCards.map(([name,value])=><Metric key={name} label={name} value={value}/>)}</div>
        </Section>

        <Section title="Account registry" icon={<Users size={17}/>} description="Search authorized portal identities and review role, account state, and MFA status. Results remain server-filtered and paginated.">
            <form onSubmit={applyFilters} aria-label="Account registry filters" className="grid gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_auto] xl:items-end">
                <label className="min-w-0 text-xs font-semibold text-[var(--ink-secondary)]">Search identity
                    <div className="relative mt-1.5"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]" size={15}/><input value={data.search} onChange={(event:ChangeEvent<HTMLInputElement>)=>setData('search',event.target.value)} className={`${fieldClass} pl-9`} placeholder="Name, ID, or email…"/></div>
                </label>
                <Filter label="Office" value={data.department_id} onChange={value=>setData('department_id',value)}><option value="">All offices</option>{departmentOptions.map(department=><option key={department.id} value={department.id}>{department.shortName||department.name}</option>)}</Filter>
                <Filter label="Portal role" value={data.role} onChange={value=>setData('role',value)}><option value="">All roles</option>{roleOptions.map(role=><option key={role} value={role}>{label(role)}</option>)}</Filter>
                <Filter label="Status" value={data.status} onChange={value=>setData('status',value)}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></Filter>
                <div className="flex shrink-0 items-center gap-2"><button disabled={processing} className="municipal-primary-button disabled:opacity-60"><Search size={14}/>Apply</button><button type="button" onClick={clearFilters} className="municipal-secondary-button"><RotateCcw size={14}/>Clear</button></div>
            </form>

            <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border-default)]">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-2.5 text-xs text-[var(--ink-secondary)]"><span className="font-semibold text-[var(--ink-primary)]">Portal identities</span><span className="shrink-0 font-semibold">{registry.total.toLocaleString('en-PH')} {registry.total === 1 ? 'account' : 'accounts'}</span></div>
                {registry.data.length===0 ? <div className="bg-[var(--surface-card)] px-5 py-10 text-center text-sm text-[var(--ink-secondary)]">No accounts match the current filters.</div> : <>
                    <div className="divide-y divide-[var(--border-default)] bg-[var(--surface-card)] lg:hidden">{registry.data.map(row=><AccountCard key={row.id} row={row}/>)}</div>
                    <div className="hidden overflow-x-auto lg:block"><table className="w-full table-auto text-left text-xs"><thead className="bg-[var(--surface-recessed)] text-xs uppercase tracking-wide text-[var(--ink-secondary)]"><tr>{['Employee','Username / email','Office','Role','Status','MFA','Actions'].map(heading=><th key={heading} className="px-3 py-2.5 font-bold whitespace-nowrap">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[var(--border-default)] bg-[var(--surface-card)]">{registry.data.map(row=><tr key={row.id} className="align-middle hover:bg-[var(--surface-hover)]"><td className="px-3 py-2.5 font-semibold text-[var(--ink-primary)]">{row.employee||'Unlinked portal user'}<div className="font-mono text-xs font-normal text-[var(--ink-secondary)]">{row.employeeNumber||'No ID'}</div></td><td className="max-w-[190px] px-3 py-2.5 text-[var(--ink-secondary)]"><div className="truncate font-semibold text-[var(--ink-primary)]">{row.username?`@${row.username}`:'Legacy email'}</div><div className="truncate">{row.loginEmail||'No contact email'}</div></td><td className="px-3 py-2.5 whitespace-nowrap text-[var(--ink-secondary)]">{row.department?.shortName||row.department?.name||'—'}</td><td className="px-3 py-2.5 text-[var(--ink-secondary)]">{row.role?label(row.role):'—'}</td><td className="px-3 py-2.5"><Status ok={row.active} yes={label(row.accountStatus)} no={label(row.accountStatus)}/></td><td className="px-3 py-2.5"><Status ok={row.mfaEnrolled} yes="Enrolled" no="Not enrolled" neutral/></td><td className="px-3 py-2.5"><AccountActions row={row}/></td></tr>)}</tbody></table></div>
                </>}
                {registry.last_page>1 && <nav aria-label="Account registry pages" className="flex flex-wrap gap-1 border-t border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3">{registry.links.map((page,index)=>page.url?<Link key={`${page.label}-${index}`} href={page.url} preserveScroll className={`inline-flex min-h-10 items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${page.active?'bg-[var(--brand-primary)] text-white':'border border-[var(--border-control)] text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]'}`}>{decodePaginationLabel(page.label)}</Link>:<span key={`${page.label}-${index}`} className="inline-flex min-h-10 items-center rounded-lg px-3 py-1.5 text-xs text-[var(--ink-secondary)] opacity-60">{decodePaginationLabel(page.label)}</span>)}</nav>}
            </div>
        </Section>

        <div className="grid gap-4 xl:grid-cols-2">
            <Section title="Office digital identity" icon={<Building2 size={17}/>} description="Official office login identities are shown only when explicitly configured.">
                <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:divide-[var(--border-default)] dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">{officeIdentities.map(office=><div key={office.code} className="flex min-w-0 flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="break-words text-sm font-semibold text-[var(--ink-primary)]">{office.shortName||office.office}</div><div className="text-xs text-[var(--ink-secondary)]">{office.code}</div></div><div className="min-w-0 sm:max-w-[55%] sm:text-right"><div className="break-all text-xs font-semibold text-[var(--ink-secondary)]">{office.officialEmail||'Awaiting official office email registry'}</div><div className="mt-0.5 text-xs text-[var(--ink-secondary)]">{office.status}</div></div></div>)}</div>
            </Section>

            <Section title="Security status" icon={<LockKeyhole size={17}/>} description="Authorized authentication and security details remain contained within system administration.">
                <div className="grid grid-cols-3 gap-2"><Metric label="Privileged" value={security.privilegedAccounts}/><Metric label="MFA enrolled" value={security.mfaEnrolled}/><Metric label="Inactive" value={security.inactiveAccounts}/></div>
                <div className="mt-3 divide-y divide-[var(--border-default)] rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">{security.recentEvents.length===0?<div className="px-4 py-7 text-center text-xs text-[var(--ink-secondary)]">No recent authentication or security activity.</div>:security.recentEvents.map((event,index)=><div key={`${event.action}-${event.createdAt}-${index}`} className="px-4 py-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="break-words text-xs font-semibold text-[var(--ink-primary)]">{event.actor||'System'} · {label(event.action)}</div><div className="mt-1 break-words text-xs leading-5 text-[var(--ink-secondary)]">{event.summary}</div></div><Status ok={event.outcome==='allowed'||event.outcome==='success'} yes={event.outcome==='success'?'Recorded':'Allowed'} no={label(event.outcome)} neutral/></div>{event.createdAt&&<time className="mt-1 block text-xs text-[var(--ink-secondary)]" dateTime={event.createdAt}>{formatDateTimePH(event.createdAt)}</time>}</div>)}</div>
            </Section>
        </div>

        <Section title="Municipal operations context" icon={<Activity size={17}/>} description="Bounded transaction aggregates for platform context. This does not grant access to restricted correspondence or private records.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{operationCards.map(([name,value])=><Metric key={name} label={name} value={value}/>)}</div>
            <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-[var(--border-default)] dark:border-[var(--border-control)] dark:bg-[var(--surface-card)] md:hidden">{operations.departmentWorkload.map(office=><article key={office.id} className="px-4 py-3"><div className="break-words text-xs font-bold text-[var(--ink-primary)]">{office.shortName||office.name}</div><div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--ink-secondary)]"><div><span className="font-bold text-[var(--ink-primary)]">{office.active}</span> active</div><div><span className="font-bold text-[var(--ink-primary)]">{office.unassigned}</span> unassigned</div><div><span className="font-bold text-amber-700 dark:text-amber-300">{office.dueSoon}</span> due soon</div><div><span className="font-bold text-rose-700 dark:text-rose-300">{office.overdue}</span> overdue</div></div></article>)}</div>
            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-[var(--border-default)] md:block"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-[var(--surface-card)] dark:text-[var(--ink-secondary)]"><tr><th className="px-4 py-3">Office</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Unassigned</th><th className="px-4 py-3">Due soon</th><th className="px-4 py-3">Overdue</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white dark:divide-[var(--border-default)] dark:bg-[var(--surface-card)]">{operations.departmentWorkload.map(office=><tr key={office.id}><td className="px-4 py-3 font-semibold text-[var(--ink-primary)]">{office.shortName||office.name}</td><td className="px-4 py-3 text-[var(--ink-secondary)]">{office.active}</td><td className="px-4 py-3 text-[var(--ink-secondary)]">{office.unassigned}</td><td className="px-4 py-3 text-[var(--ink-secondary)]">{office.dueSoon}</td><td className="px-4 py-3 font-semibold text-rose-700 dark:text-rose-300">{office.overdue}</td></tr>)}</tbody></table></div>
        </Section>
    </PageFrame></AppLayout>;
}

function AccountCard({row}:{row:RegistryRow}) { return <article className="min-w-0 px-4 py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-sm font-bold text-[var(--ink-primary)]">{row.employee||'Unlinked portal user'}</h3><div className="mt-0.5 break-all text-xs text-[var(--ink-secondary)]">{row.username?`@${row.username}`:'Legacy email login'} · {row.loginEmail||'No contact email'}</div></div><Status ok={row.active} yes={label(row.accountStatus)} no={label(row.accountStatus)}/></div><dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><div><dt className="font-bold uppercase text-[var(--ink-secondary)]">Employee no.</dt><dd className="mt-0.5 break-words text-[var(--ink-secondary)]">{row.employeeNumber||'—'}</dd></div><div><dt className="font-bold uppercase text-[var(--ink-secondary)]">Office</dt><dd className="mt-0.5 break-words text-[var(--ink-secondary)]">{row.department?.shortName||row.department?.name||'—'}</dd></div><div><dt className="font-bold uppercase text-[var(--ink-secondary)]">Role</dt><dd className="mt-0.5 break-words text-[var(--ink-secondary)]">{row.role?label(row.role):'—'}</dd></div><div><dt className="font-bold uppercase text-[var(--ink-secondary)]">MFA</dt><dd className="mt-0.5"><Status ok={row.mfaEnrolled} yes="Enrolled" no="Not enrolled" neutral/></dd></div></dl><div className="mt-3"><AccountActions row={row}/></div></article>; }
function AccountActions({ row }: { row: RegistryRow }) {
    const [dialogMode, setDialogMode] = useState<null | 'suspend' | 'recover'>(null);
    if (row.role === 'system_admin' || row.role === 'system_administrator' || row.accountStatus === 'pending' || row.accountStatus === 'deactivated') {
        return <span className="whitespace-nowrap text-xs text-[var(--ink-secondary)]">Operator controlled</span>;
    }
    return (
        <>
            <div className="flex flex-nowrap items-center gap-1.5">
                {row.active ? (
                    <button
                        type="button"
                        onClick={() => setDialogMode('suspend')}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-2.5 text-xs font-semibold text-[var(--status-danger-fg)]"
                    >
                        <Ban size={13} aria-hidden="true" />
                        <span>Suspend</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => router.post(`/admin/accounts/${row.id}/reactivate`, {}, { preserveScroll: true })}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[var(--status-ok-border)] bg-[var(--status-ok-bg)] px-2.5 text-xs font-semibold text-[var(--status-ok-fg)]"
                    >
                        <UserCheck size={13} aria-hidden="true" />
                        <span>Reactivate</span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => setDialogMode('recover')}
                    className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[var(--border-control)] px-2.5 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                >
                    <KeyRound size={13} aria-hidden="true" />
                    <span>Recover</span>
                </button>
            </div>
            <ConfirmDialog
                open={dialogMode === 'suspend'}
                title={`Suspend ${row.employee || row.username || 'account'}?`}
                message="Suspending this portal account immediately revokes sign-in access until reactivated."
                confirmLabel="Suspend account"
                destructive
                promptLabel="Reason for suspension"
                promptPlaceholder="Enter documented administrative reason"
                promptRequired
                onCancel={() => setDialogMode(null)}
                onConfirm={(reason) => {
                    setDialogMode(null);
                    if (reason) router.post(`/admin/accounts/${row.id}/suspend`, { reason }, { preserveScroll: true });
                }}
            />
            <ConfirmDialog
                open={dialogMode === 'recover'}
                title="Issue account recovery code?"
                message="This invalidates the current password, active sessions, and MFA enrollment, then issues a new one-time activation code."
                confirmLabel="Issue recovery code"
                destructive
                onCancel={() => setDialogMode(null)}
                onConfirm={() => {
                    setDialogMode(null);
                    router.post(`/admin/accounts/${row.id}/recovery`, {}, { preserveScroll: true });
                }}
            />
        </>
    );
}
function Section({title,description,icon,children}:{title:string;description:string;icon:ReactNode;children:ReactNode}) { return <section className={`rounded-xl border p-4 transition-colors sm:p-5 ${insetSurface}`}><div className="mb-4 flex items-start gap-3"><div className="mt-0.5 rounded-xl bg-[var(--brand-soft)] p-2 text-[var(--brand-ink)]">{icon}</div><div className="min-w-0"><h2 className="font-bold text-[var(--ink-primary)]">{title}</h2><p className="mt-1 text-xs leading-5 text-[var(--ink-secondary)]">{description}</p></div></div>{children}</section>; }
function Metric({label:text,value}:{label:string;value:number}) { return <div className="min-w-0 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3.5 py-3"><div className="text-xl font-bold tabular-nums text-[var(--ink-primary)] sm:text-2xl">{value.toLocaleString('en-PH')}</div><div className="mt-1 break-words text-xs font-medium leading-4 text-[var(--ink-secondary)]">{text}</div></div>; }
function Status({ok,yes,no,neutral=false}:{ok:boolean;yes:string;no:string;neutral?:boolean}) { return <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${ok?'border-[var(--status-ok-border)] bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]':neutral?'border-[var(--status-neutral-border)] bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]':'border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]'}`}>{ok?yes:no}</span>; }
function Filter({label:text,value,onChange,children}:{label:string;value:string;onChange:(value:string)=>void;children:ReactNode}) { return <label className="min-w-0 text-xs font-semibold text-[var(--ink-secondary)]">{text}<select value={value} onChange={(event:ChangeEvent<HTMLSelectElement>)=>onChange(event.target.value)} className={`mt-1.5 ${fieldClass}`}>{children}</select></label>; }
