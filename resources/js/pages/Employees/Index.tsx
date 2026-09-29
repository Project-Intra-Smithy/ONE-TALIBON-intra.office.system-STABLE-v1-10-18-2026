import { Link, router } from '@inertiajs/react';
import { Building2, ChevronRight, Search, UserRoundCheck, UsersRound } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';

type Department = {
    code: string;
    name: string;
    short_name?: string;
};

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
    filters: {
        q: string;
        department: string;
    };
    summary: {
        employees: number;
        portalAccounts: number;
        featuredLogins: number;
        offices: number;
    };
};

const summaryItems = [
    {
        label: 'Employees',
        key: 'employees',
        icon: UsersRound,
        surface: 'bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-200',
        iconSurface: 'bg-white/80 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
    {
        label: 'Municipal Offices',
        key: 'offices',
        icon: Building2,
        surface: 'bg-amber-50/80 text-amber-950 dark:bg-amber-950/30 dark:text-amber-200',
        iconSurface: 'bg-white/80 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    },
    {
        label: 'Portal Accounts',
        key: 'portalAccounts',
        icon: UserRoundCheck,
        surface: 'bg-blue-50/80 text-blue-950 dark:bg-blue-950/35 dark:text-blue-200',
        iconSurface: 'bg-white/80 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    },
] as const;

export default function EmployeeDirectory({ employees, departments, filters, summary }: Props) {
    const [q, setQ] = useState(filters.q || '');
    const [department, setDepartment] = useState(filters.department || '');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get('/employees', { q, department }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const reset = () => {
        setQ('');
        setDepartment('');
        router.get('/employees', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const firstResult = employees.data.length === 0
        ? 0
        : ((employees.current_page - 1) * employees.per_page) + 1;
    const lastResult = employees.data.length === 0
        ? 0
        : firstResult + employees.data.length - 1;

    return (
        <AppLayout title="HR Employee Portal">
            <PageFrame density="compact">
                <PageHeader
                    eyebrow="Personnel reference foundation"
                    title="HR Employee Portal"
                    description="Personnel directory and employee reference records for municipal work context. This is a reference foundation only and does not present payroll, DTR, attendance, leave, performance, or broad HRIS administration."
                    icon={UsersRound}
                />

                <section className="grid gap-2 sm:grid-cols-3" aria-label="HR Employee Portal summary">
                    {summaryItems.map(({ label, key, icon: Icon, surface, iconSurface }) => (
                        <div
                            key={label}
                            className={`flex min-h-[48px] min-w-0 items-center gap-2.5 rounded-lg border border-current/10 px-3 py-2 ${surface}`}
                        >
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconSurface}`}>
                                <Icon size={16} aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <div className="text-[17px] font-extrabold leading-none tabular-nums">{summary[key]}</div>
                                <div className="mt-1 truncate text-[11px] font-semibold leading-none opacity-75">{label}</div>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="overflow-visible rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
                    <form
                        onSubmit={submit}
                        aria-label="Employee directory filters"
                        className="grid gap-2 border-b border-slate-100 p-2.5 dark:border-slate-700 sm:grid-cols-[minmax(0,1fr)_260px_auto_auto]"
                    >
                        <label className="relative min-w-0">
                            <span className="sr-only">Search employees</span>
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                aria-hidden="true"
                            />
                            <input
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Search name, employee number, work email, or position"
                                className="min-h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            />
                        </label>

                        <select
                            aria-label="Office"
                            value={department}
                            onChange={(event) => setDepartment(event.target.value)}
                            className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                        >
                            <option value="">All offices</option>
                            {departments.map((office) => (
                                <option key={office.code} value={office.code}>
                                    {office.short_name || office.name}
                                </option>
                            ))}
                        </select>

                        <button className="min-h-9 rounded-lg bg-[#0b2852] px-4 text-sm font-semibold text-white transition hover:bg-[#123764] focus:outline-none focus:ring-2 focus:ring-blue-700/30">
                            Search
                        </button>

                        <button
                            type="button"
                            onClick={reset}
                            className="min-h-9 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700/20 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        >
                            Reset
                        </button>
                    </form>

                    <div className="flex min-h-9 items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-[11px] dark:border-slate-700">
                        <div className="font-bold text-slate-900 dark:text-slate-100">Personnel reference register</div>
                        <div className="text-right text-slate-500 dark:text-slate-400">
                            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{firstResult}–{lastResult}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{employees.total}</span> employees
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-700 md:hidden" aria-label="Employee directory results">
                        {employees.data.map((employee) => (
                            <article key={employee.id} className="p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <Link
                                            href={`/employees/${employee.id}`}
                                            className="font-semibold text-slate-950 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700/30 dark:text-slate-100 dark:hover:text-blue-300"
                                        >
                                            {employee.full_name || 'Employee record'}
                                        </Link>
                                        <div className="mt-0.5 break-all text-xs text-slate-500 dark:text-slate-400">
                                            {employee.employee_number}
                                            {employee.work_email ? ` · ${employee.work_email}` : ''}
                                        </div>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${employee.user_id
                                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                    }`}>
                                        {employee.user_id ? 'Enabled' : 'Not linked'}
                                    </span>
                                </div>

                                <dl className="mt-2.5 grid gap-2 text-xs sm:grid-cols-2">
                                    <div>
                                        <dt className="font-bold uppercase tracking-wide text-slate-400">Office</dt>
                                        <dd className="mt-0.5 text-slate-700 dark:text-slate-300">
                                            {employee.department.short_name || employee.department.name}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="font-bold uppercase tracking-wide text-slate-400">Position</dt>
                                        <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{employee.position_title}</dd>
                                    </div>
                                </dl>

                                <Link
                                    href={`/employees/${employee.id}`}
                                    className="mt-2.5 inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-700/30 dark:border-slate-600 dark:text-slate-200"
                                    aria-label={`View ${employee.full_name || 'employee'} profile`}
                                >
                                    View profile
                                    <ChevronRight size={14} aria-hidden="true" />
                                </Link>
                            </article>
                        ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[820px] table-fixed text-left text-sm">
                            <colgroup>
                                <col className="w-[40%]" />
                                <col className="w-[19%]" />
                                <col className="w-[27%]" />
                                <col className="w-[11%]" />
                                <col className="w-[3%]" />
                            </colgroup>
                            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.07em] text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                                <tr>
                                    <th className="px-3 py-2.5">Employee</th>
                                    <th className="px-3 py-2.5">Office</th>
                                    <th className="px-3 py-2.5">Position</th>
                                    <th className="px-3 py-2.5">Portal account</th>
                                    <th className="px-2 py-2.5"><span className="sr-only">Open profile</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {employees.data.map((employee) => (
                                    <tr
                                        key={employee.id}
                                        className="group h-[58px] transition-colors hover:bg-emerald-50/35 dark:hover:bg-slate-800/50"
                                    >
                                        <td className="px-3 py-2.5 align-middle">
                                            <Link
                                                href={`/employees/${employee.id}`}
                                                className="font-semibold text-slate-950 transition hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700/30 dark:text-slate-100 dark:hover:text-blue-300"
                                            >
                                                {employee.full_name || 'Employee record'}
                                            </Link>
                                            <div className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                                                {employee.employee_number}
                                                {employee.work_email ? ` · ${employee.work_email}` : ''}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 align-middle text-slate-700 dark:text-slate-300">
                                            <span className="line-clamp-2">{employee.department.short_name || employee.department.name}</span>
                                        </td>
                                        <td className="px-3 py-2.5 align-middle text-slate-700 dark:text-slate-300">
                                            <span className="line-clamp-2">{employee.position_title}</span>
                                        </td>
                                        <td className="px-3 py-2.5 align-middle">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase ${employee.user_id
                                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                            }`}>
                                                {employee.user_id ? 'Enabled' : 'Not linked'}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2.5 text-right align-middle">
                                            <Link
                                                href={`/employees/${employee.id}`}
                                                aria-label={`View ${employee.full_name || 'employee'} profile`}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 opacity-60 transition hover:bg-white hover:text-[var(--municipal-brand)] focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 group-hover:opacity-100 dark:hover:bg-slate-900"
                                            >
                                                <ChevronRight size={15} aria-hidden="true" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {employees.data.length === 0 && (
                        <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                            No employees match the current filters.
                        </div>
                    )}

                    <div className="flex flex-col gap-2 border-t border-slate-100 px-3 py-2.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                        <div>Showing {employees.data.length} of {employees.total} matching employees</div>
                        <div className="flex gap-2">
                            {employees.prev_page_url && (
                                <Link
                                    href={employees.prev_page_url}
                                    preserveScroll
                                    preserveState
                                    className="min-h-9 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
                                >
                                    Previous
                                </Link>
                            )}
                            {employees.next_page_url && (
                                <Link
                                    href={employees.next_page_url}
                                    preserveScroll
                                    preserveState
                                    className="min-h-9 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    </div>
                </section>
            </PageFrame>
        </AppLayout>
    );
}
