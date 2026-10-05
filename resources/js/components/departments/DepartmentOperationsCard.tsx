import { Building2, FolderKanban, Users } from 'lucide-react';

type Office = {
    id: number;
    code: string;
    name: string;
    short_name?: string | null;
    branch: string;
    office_type: string;
    active_employees_count: number;
    active_transactions_count: number;
};

const pretty = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function DepartmentOperationsCard({ office }: { office: Office }) {
    return (
        <article className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 border-l-[3px] border-l-[var(--municipal-brand)] bg-white dark:border-y-slate-700 dark:border-r-slate-700 dark:bg-[#142236]">
            <div className="px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand)]">
                        <Building2 size={15} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="break-words text-base font-bold leading-5 text-slate-950 dark:text-slate-100 sm:text-[17px]">{office.name}</h2>
                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                            {office.code} <span aria-hidden="true"> / </span> {pretty(office.office_type)}
                        </div>
                    </div>
                </div>
            </div>

            <dl className="mx-4 grid grid-cols-2 gap-2 pb-4 sm:mx-5 sm:pb-5">
                <Metric label="Employees" value={office.active_employees_count} icon={Users} />
                <Metric label="Active work" value={office.active_transactions_count} icon={FolderKanban} />
            </dl>
        </article>
    );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
    return (
        <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-900/40">
            <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Icon size={12} aria-hidden="true" /> {label}
            </dt>
            <dd className="mt-0.5 text-lg font-bold tabular-nums text-slate-950 dark:text-slate-100">{value}</dd>
        </div>
    );
}
