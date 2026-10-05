import { Link, router } from '@inertiajs/react';
import { Building2, ChevronRight, Search, UserRoundCheck, UsersRound } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import DetailDrawer from '../../components/municipal-systems/DetailDrawer';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';

type Department = { code: string; name: string; short_name?: string };
type Employee = {
    id: number;
    employee_number: string;
    full_name?: string;
    work_email?: string;
    position_title: string;
    employment_status: string;
    user_id?: number | null;
    department: Department;
};
type PaginatedEmployees = {
    data: Employee[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url?: string | null;
    next_page_url?: string | null;
};
type Props = {
    employees: PaginatedEmployees;
    departments: Department[];
    filters: { q: string; department: string };
    summary: { employees: number; portalAccounts: number; offices: number };
};

function initials(name?: string): string {
    if (!name) return 'ER';
    return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase() || 'ER';
}

export default function EmployeeDirectory({ employees, departments, filters, summary }: Props) {
    const [q, setQ] = useState(filters.q || '');
    const [department, setDepartment] = useState(filters.department || '');
    const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);
    const portalCoverage = summary.employees > 0 ? Math.round((summary.portalAccounts / summary.employees) * 100) : 0;

    const summaryItems = [
        { label: 'Employees', value: summary.employees, icon: UsersRound, surface: 'bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-200', iconSurface: 'bg-white/80 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
        { label: 'Municipal Offices', value: summary.offices, icon: Building2, surface: 'bg-amber-50/80 text-amber-950 dark:bg-amber-950/30 dark:text-amber-200', iconSurface: 'bg-white/80 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
        { label: 'Portal Accounts', value: summary.portalAccounts, icon: UserRoundCheck, surface: 'bg-blue-50/80 text-blue-950 dark:bg-blue-950/35 dark:text-blue-200', iconSurface: 'bg-white/80 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
        { label: 'Accounts Linked', value: `${portalCoverage}%`, icon: UserRoundCheck, surface: 'bg-violet-50/80 text-violet-950 dark:bg-violet-950/30 dark:text-violet-200', iconSurface: 'bg-white/80 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300' },
    ];

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get('/employees', { q, department }, { preserveState: true, preserveScroll: true, replace: true });
    };
    const reset = () => {
        setQ('');
        setDepartment('');
        router.get('/employees', {}, { preserveState: true, replace: true });
    };
    const firstResult = employees.data.length === 0 ? 0 : ((employees.current_page - 1) * employees.per_page) + 1;
    const lastResult = employees.data.length === 0 ? 0 : firstResult + employees.data.length - 1;

    return (
        <AppLayout title="Employee & Office Directory">
            <PageFrame density="compact">
                <PageHeader eyebrow="ORGANIZATION DIRECTORY" title="Employee & Office Directory" description="Municipal employees, office assignments and portal-account linkage in one directory." icon={UsersRound} />

                <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Employee and office directory summary">
                    {summaryItems.map(({ label, value, icon: Icon, surface, iconSurface }) => (
                        <div key={label} className={`flex min-h-[56px] min-w-0 items-center gap-2.5 rounded-lg border border-current/10 px-3 py-2 ${surface}`}>
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconSurface}`}><Icon size={16} aria-hidden="true" /></span>
                            <div className="min-w-0"><div className="text-[17px] font-extrabold leading-none tabular-nums">{value}</div><div className="mt-1 truncate text-[11px] font-semibold leading-none opacity-75">{label}</div></div>
                        </div>
                    ))}
                </section>

                <section className="overflow-visible rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
                    <form onSubmit={submit} aria-label="Employee directory filters" className="grid gap-2 border-b border-slate-100 p-2.5 dark:border-slate-700 sm:grid-cols-[minmax(0,1fr)_260px_auto_auto]">
                        <label className="relative min-w-0"><span className="sr-only">Search employees</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name, employee number, work email, or position" className="min-h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" /></label>
                        <select aria-label="Office" value={department} onChange={(event) => setDepartment(event.target.value)} className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"><option value="">All offices</option>{departments.map((office) => <option key={office.code} value={office.code}>{office.short_name || office.name}</option>)}</select>
                        <button className="min-h-9 rounded-lg bg-[#0b2852] px-4 text-sm font-semibold text-white transition hover:bg-[#123764] focus:outline-none focus:ring-2 focus:ring-blue-700/30">Search</button>
                        <button type="button" onClick={reset} className="min-h-9 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700/20 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">Reset</button>
                    </form>

                    <div className="flex min-h-9 items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-[11px] dark:border-slate-700"><div className="font-bold text-slate-900 dark:text-slate-100">Employee directory register</div><div className="text-right text-slate-500 dark:text-slate-400">Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{firstResult}–{lastResult}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{employees.total}</span> employees</div></div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-700 md:hidden" aria-label="Employee directory results">
                        {employees.data.map((employee) => (
                            <article key={employee.id} className="p-3">
                                <button type="button" onClick={() => setPreviewEmployee(employee)} className="flex w-full items-start gap-3 text-left"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200">{initials(employee.full_name)}</span><span className="min-w-0 flex-1"><span className="block font-semibold text-slate-950 dark:text-slate-100">{employee.full_name || 'Employee record'}</span><span className="mt-0.5 block break-all text-xs text-slate-500 dark:text-slate-400">{employee.employee_number}{employee.work_email ? ` · ${employee.work_email}` : ''}</span></span><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${employee.user_id ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{employee.user_id ? 'Enabled' : 'Not linked'}</span></button>
                                <dl className="mt-2.5 grid gap-2 text-xs sm:grid-cols-2"><div><dt className="font-bold uppercase tracking-wide text-slate-400">Office</dt><dd className="mt-0.5 text-slate-700 dark:text-slate-300">{employee.department.short_name || employee.department.name}</dd></div><div><dt className="font-bold uppercase tracking-wide text-slate-400">Position</dt><dd className="mt-0.5 text-slate-700 dark:text-slate-300">{employee.position_title}</dd></div></dl>
                                <Link href={`/employees/${employee.id}`} className="mt-2.5 inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-700/30 dark:border-slate-600 dark:text-slate-200" aria-label={`View ${employee.full_name || 'employee'} profile`}>View profile <ChevronRight size={14} aria-hidden="true" /></Link>
                            </article>
                        ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[820px] table-fixed text-left text-sm">
                            <colgroup><col className="w-[40%]" /><col className="w-[19%]" /><col className="w-[27%]" /><col className="w-[11%]" /><col className="w-[3%]" /></colgroup>
                            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.07em] text-slate-500 dark:bg-slate-900/40 dark:text-slate-400"><tr><th className="px-3 py-2.5">Employee</th><th className="px-3 py-2.5">Office</th><th className="px-3 py-2.5">Position</th><th className="px-3 py-2.5">Portal account</th><th className="px-2 py-2.5"><span className="sr-only">Open profile</span></th></tr></thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {employees.data.map((employee) => (
                                    <tr key={employee.id} onClick={() => setPreviewEmployee(employee)} className="group h-[58px] cursor-pointer transition-colors hover:bg-emerald-50/35 dark:hover:bg-slate-800/50">
                                        <td className="px-3 py-2 align-middle"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[9px] font-extrabold text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200">{initials(employee.full_name)}</span><div className="min-w-0"><Link href={`/employees/${employee.id}`} onClick={(event) => event.stopPropagation()} className="font-semibold text-slate-950 transition hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700/30 dark:text-slate-100 dark:hover:text-blue-300">{employee.full_name || 'Employee record'}</Link><div className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{employee.employee_number}{employee.work_email ? ` · ${employee.work_email}` : ''}</div></div></div></td>
                                        <td className="px-3 py-2 align-middle"><span className="inline-flex max-w-full rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"><span className="truncate">{employee.department.short_name || employee.department.name}</span></span></td>
                                        <td className="px-3 py-2 align-middle text-slate-700 dark:text-slate-300"><span className="line-clamp-2">{employee.position_title}</span></td>
                                        <td className="px-3 py-2 align-middle"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${employee.user_id ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{employee.user_id ? 'Enabled' : 'Not linked'}</span></td>
                                        <td className="px-2 py-2 text-right align-middle"><Link href={`/employees/${employee.id}`} onClick={(event) => event.stopPropagation()} aria-label={`View ${employee.full_name || 'employee'} profile`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 opacity-60 transition hover:bg-white hover:text-[var(--municipal-brand)] focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 group-hover:opacity-100 dark:hover:bg-slate-900"><ChevronRight size={15} aria-hidden="true" /></Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {employees.data.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No employees match the current filters.</div>}
                    <div className="flex flex-col gap-2 border-t border-slate-100 px-3 py-2.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between"><div>Showing {employees.data.length} of {employees.total} matching employees</div><div className="flex gap-2">{employees.prev_page_url && <Link href={employees.prev_page_url} preserveScroll preserveState className="min-h-9 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200">Previous</Link>}{employees.next_page_url && <Link href={employees.next_page_url} preserveScroll preserveState className="min-h-9 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200">Next</Link>}</div></div>
                </section>

                <DetailDrawer size="compact" open={Boolean(previewEmployee)} onClose={() => setPreviewEmployee(null)} title={previewEmployee?.full_name || 'Employee record'} eyebrow="Employee quick preview">
                    {previewEmployee && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[13px] font-extrabold text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200">{initials(previewEmployee.full_name)}</span><div className="min-w-0"><div className="text-[15px] font-extrabold text-slate-950 dark:text-slate-100">{previewEmployee.full_name || 'Employee record'}</div><div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{previewEmployee.employee_number}</div></div></div>
                            <dl className="grid gap-3 text-[11px]"><div><dt className="text-slate-400">Work email</dt><dd className="mt-0.5 break-all font-semibold text-slate-700 dark:text-slate-200">{previewEmployee.work_email || '—'}</dd></div><div><dt className="text-slate-400">Position</dt><dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{previewEmployee.position_title}</dd></div><div><dt className="text-slate-400">Office</dt><dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{previewEmployee.department.short_name || previewEmployee.department.name}</dd></div><div><dt className="text-slate-400">Employment status</dt><dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{previewEmployee.employment_status}</dd></div><div><dt className="text-slate-400">Portal account</dt><dd className="mt-1"><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase ${previewEmployee.user_id ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{previewEmployee.user_id ? 'Enabled' : 'Not linked'}</span></dd></div></dl>
                            <Link href={`/employees/${previewEmployee.id}`} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#0b2852] px-3 text-[11px] font-bold text-white transition hover:bg-[#123764] focus:outline-none focus:ring-2 focus:ring-blue-700/30">Open full profile <ChevronRight size={14} aria-hidden="true" /></Link>
                        </div>
                    )}
                </DetailDrawer>
            </PageFrame>
        </AppLayout>
    );
}
