import { Link, router } from '@inertiajs/react';
import { Clock3, RotateCcw, Search } from 'lucide-react';
import { type FormEvent, useEffect, useId, useState } from 'react';
import { KpiCard, PageHeader, StatusBadge } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';

type Department = { code: string; name: string; short_name?: string };
type Employee = {
    id: number;
    employee_number: string;
    full_name?: string;
    work_email?: string;
    position_title: string;
    employment_status: string;
    department: Department;
    presence: 'online' | 'offline';
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
    summary: { employees: number; portalAccounts: number; featuredLogins: number; offices: number };
};

export default function EmployeeDirectory({ employees, departments, filters, summary }: Props) {
    const searchId = useId();
    const officeId = useId();
    const [q, setQ] = useState(filters.q || '');
    const [department, setDepartment] = useState(filters.department || '');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get('/employees', { q, department }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const reset = () => {
        setQ('');
        setDepartment('');
        router.get('/employees', {}, { preserveState: true, replace: true });
    };

    useEffect(() => {
        const interval = window.setInterval(() => {
            if (document.visibilityState === 'visible') router.reload({ only: ['employees'] });
        }, 60000);
        return () => window.clearInterval(interval);
    }, []);

    return (
        <AppLayout title="Employee Directory">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Municipal workforce"
                    title="Employee Directory"
                    subtitle="Search municipal personnel by office and position. Presence reflects portal activity, not physical attendance."
                    actions={
                        <Link href="/hris/attendance" className="municipal-secondary-button">
                            <Clock3 size={15} aria-hidden="true" />
                            <span>My attendance</span>
                        </Link>
                    }
                />

                <section aria-label="Employee directory summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <KpiCard label="Employees" value={summary.employees.toLocaleString()} accent="brand" />
                    <KpiCard label="Active Offices" value={summary.offices.toLocaleString()} accent="neutral" />
                    <KpiCard label="Portal Identities" value={summary.portalAccounts.toLocaleString()} accent="ok" />
                </section>

                <section className="tcds-card overflow-hidden">
                    <search>
                        <form
                            onSubmit={submit}
                            aria-label="Employee directory filters"
                            className="flex flex-wrap items-center gap-2.5 border-b border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5 sm:px-4"
                        >
                            <div className="relative min-w-[14rem] flex-1">
                                <label htmlFor={searchId} className="sr-only">Search employees</label>
                                <Search
                                    size={15}
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]"
                                />
                                <input
                                    id={searchId}
                                    type="search"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Search name, ID, email, or position…"
                                    className="tcds-input pl-9"
                                />
                            </div>
                            <div className="w-full sm:w-60">
                                <label className="sr-only" htmlFor={officeId}>Office</label>
                                <select
                                    id={officeId}
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="tcds-input"
                                >
                                    <option value="">All offices</option>
                                    {departments.map((office) => (
                                        <option key={office.code} value={office.code}>
                                            {office.short_name || office.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="submit" className="municipal-primary-button">Search</button>
                                <button type="button" onClick={reset} className="municipal-secondary-button">
                                    <RotateCcw size={15} aria-hidden="true" />
                                    <span>Reset</span>
                                </button>
                            </div>
                        </form>
                    </search>

                    <div tabIndex={0} role="region" aria-label="Employee directory results" className="overflow-x-auto">
                        <table className="tcds-table" data-stack-mobile="true">
                            <thead>
                                <tr>
                                    <th scope="col">Employee</th>
                                    <th scope="col">Office</th>
                                    <th scope="col">Position</th>
                                    <th scope="col">Presence</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.data.map((employee) => {
                                    const online = employee.presence === 'online';
                                    return (
                                        <tr key={employee.id}>
                                            <th scope="row" className="font-normal">
                                                <Link
                                                    href={`/employees/${employee.id}`}
                                                    className="font-semibold text-[var(--brand-ink)] hover:underline"
                                                >
                                                    {employee.full_name || 'Employee record'}
                                                </Link>
                                                <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                    <span className="font-mono">{employee.employee_number}</span>
                                                    {employee.work_email ? ` · ${employee.work_email}` : ''}
                                                </div>
                                            </th>
                                            <td data-label="Office" className="text-sm text-[var(--ink-primary)]">
                                                {employee.department.short_name || employee.department.name}
                                            </td>
                                            <td data-label="Position" className="text-sm text-[var(--ink-secondary)]">
                                                {employee.position_title}
                                            </td>
                                            <td data-label="Presence">
                                                <StatusBadge tone={online ? 'ok' : 'neutral'}>
                                                    <span
                                                        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-[var(--ink-secondary)] opacity-60'}`}
                                                        aria-hidden="true"
                                                    />
                                                    {online ? 'Online' : 'Offline'}
                                                </StatusBadge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {employees.data.length === 0 && (
                        <div className="px-5 py-10 text-center text-sm text-[var(--ink-secondary)]">
                            No employees match the current filters.
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3 text-xs text-[var(--ink-secondary)]">
                        <div>
                            Showing {employees.data.length} of {employees.total} matching {employees.total === 1 ? 'employee' : 'employees'}
                        </div>
                        <div className="flex gap-2">
                            {employees.prev_page_url && (
                                <Link href={employees.prev_page_url} preserveScroll preserveState className="municipal-secondary-button min-h-9 px-3 text-xs">
                                    Previous
                                </Link>
                            )}
                            {employees.next_page_url && (
                                <Link href={employees.next_page_url} preserveScroll preserveState className="municipal-secondary-button min-h-9 px-3 text-xs">
                                    Next
                                </Link>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
