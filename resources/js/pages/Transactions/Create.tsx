import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, Building2, Paperclip } from 'lucide-react';
import EvidenceFields from '../../components/documents/EvidenceFields';
import AppLayout from '../../layouts/AppLayout';

type Department = {
    id: number;
    code: string;
    name: string;
    short_name?: string | null;
    branch: string;
    office_type?: string;
};

type Employee = {
    id: number;
    employee_number: string;
    full_name?: string | null;
    department_id: number;
    position_title: string;
};

type TransactionCreateForm = {
    transaction_type: string;
    request_category: string;
    request_type: string;
    action_required: string;
    target_department_id: number | '';
    assigned_employee_id: number | '';
    priority: string;
    due_at: string;
    title: string;
    description: string;
    evidence: File[];
};

type Props = {
    departments: Department[];
    assignableEmployees: Employee[];
    requestCategories: Record<string, string[]>;
    actionOptions: string[];
};

const fieldClass = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:ring-blue-950/50';
const textareaClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:ring-blue-950/50';
const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300';
const labelTextClass = 'mb-1.5 block';

export default function Create({ departments, assignableEmployees, requestCategories, actionOptions }: Props) {
    const executive = departments.filter((department) => department.branch !== 'legislative');
    const legislative = departments.filter((department) => department.branch === 'legislative');
    const categoryNames = Object.keys(requestCategories);
    const initialCategory = categoryNames[0] ?? '';
    const initialTargetDepartment = departments[0]?.id ?? '';

    const { data, setData, post, processing, errors } = useForm<TransactionCreateForm>({
        transaction_type: 'internal_request',
        request_category: initialCategory,
        request_type: requestCategories[initialCategory]?.[0] ?? '',
        action_required: actionOptions[0] ?? '',
        target_department_id: initialTargetDepartment,
        assigned_employee_id: '',
        priority: 'normal',
        due_at: '',
        title: '',
        description: '',
        evidence: [],
    });

    const requestTypes = requestCategories[data.request_category] ?? [];
    const selectedEmployees = assignableEmployees.filter((employee) => employee.department_id === Number(data.target_department_id));
    const formErrors = Object.values(errors).filter((message): message is string => typeof message === 'string');
    const evidenceHasError = Object.keys(errors).some((key) => key === 'evidence' || key.startsWith('evidence.'));

    return (
        <AppLayout title="Create Work Request">
            <Head title="Create Work Request" />
            <div className="mx-auto max-w-4xl space-y-3">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-700 dark:text-blue-300">Work Queue · New request</div>
                        <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-950 dark:text-slate-100">Create Work Request</h1>
                        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">Route accountable work to the correct municipal office and responsible person.</p>
                    </div>
                    <Link href="/transactions" className="inline-flex min-h-10 items-center text-xs font-semibold text-blue-700 hover:underline dark:text-blue-300">← Back to Work Queue</Link>
                </header>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (processing) return;
                        post('/transactions', { forceFormData: true });
                    }}
                    className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#142236] sm:p-5"
                >
                    {formErrors.length > 0 && (
                        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                            <div className="font-semibold">The work request could not be routed.</div>
                            <ul className="mt-1 list-disc space-y-0.5 pl-5">{formErrors.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}</ul>
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className={labelClass}>
                            <span className={labelTextClass}>Request Category</span>
                            <select value={data.request_category} onChange={(event) => {
                                const category = event.target.value;
                                setData('request_category', category);
                                setData('request_type', requestCategories[category]?.[0] ?? '');
                            }} className={fieldClass} required>
                                {categoryNames.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                            {errors.request_category && <span className="mt-1 block text-xs text-red-600">{errors.request_category}</span>}
                        </label>

                        <label className={labelClass}>
                            <span className={labelTextClass}>Request Type</span>
                            <select value={data.request_type} onChange={(event) => setData('request_type', event.target.value)} className={fieldClass} required>
                                {requestTypes.map((requestType) => <option key={requestType} value={requestType}>{requestType}</option>)}
                            </select>
                            {errors.request_type && <span className="mt-1 block text-xs text-red-600">{errors.request_type}</span>}
                        </label>
                    </div>

                    <label className={labelClass}>
                        <span className={labelTextClass}>Action Required</span>
                        <select value={data.action_required} onChange={(event) => setData('action_required', event.target.value)} className={fieldClass} required>
                            {actionOptions.map((action) => <option key={action} value={action}>{action}</option>)}
                        </select>
                        {errors.action_required && <span className="mt-1 block text-xs text-red-600">{errors.action_required}</span>}
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className={labelClass}>
                            <span className={labelTextClass}>Receiving Office</span>
                            <select value={data.target_department_id} onChange={(event) => {
                                setData('target_department_id', Number(event.target.value));
                                setData('assigned_employee_id', '');
                            }} className={fieldClass} required>
                                {executive.length > 0 && <optgroup label="Executive / Administrative">{executive.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</optgroup>}
                                {legislative.length > 0 && <optgroup label="Legislative Branch">{legislative.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</optgroup>}
                            </select>
                            {errors.target_department_id && <span className="mt-1 block text-xs text-red-600">{errors.target_department_id}</span>}
                        </label>

                        <label className={labelClass}>
                            <span className={labelTextClass}>Assigned Person <span className="font-normal text-slate-400">optional</span></span>
                            <select value={data.assigned_employee_id} onChange={(event) => setData('assigned_employee_id', event.target.value ? Number(event.target.value) : '')} className={fieldClass}>
                                <option value="">Unassigned / office queue</option>
                                {selectedEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name || employee.employee_number} · {employee.position_title}</option>)}
                            </select>
                            {errors.assigned_employee_id && <span className="mt-1 block text-xs text-red-600">{errors.assigned_employee_id}</span>}
                        </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className={labelClass}>
                            <span className={labelTextClass}>Priority</span>
                            <select value={data.priority} onChange={(event) => setData('priority', event.target.value)} className={fieldClass} required>
                                <option value="normal">Normal</option>
                                <option value="high">Priority</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </label>

                        <label className={labelClass}>
                            <span className={labelTextClass}>Target Completion</span>
                            <input type="date" value={data.due_at} onChange={(event) => setData('due_at', event.target.value)} className={fieldClass} required />
                            {errors.due_at && <span className="mt-1 block text-xs text-red-600">{errors.due_at}</span>}
                        </label>
                    </div>

                    <label className={labelClass}>
                        <span className={labelTextClass}>Subject</span>
                        <input value={data.title} onChange={(event) => setData('title', event.target.value)} className={fieldClass} placeholder="What requires action?" required />
                        {errors.title && <span className="mt-1 block text-xs text-red-600">{errors.title}</span>}
                    </label>

                    <label className={labelClass}>
                        <span className={labelTextClass}>Description</span>
                        <textarea value={data.description} onChange={(event) => setData('description', event.target.value)} rows={3} className={textareaClass} placeholder="Context, expected output, and supporting details" />
                    </label>

                    <details open={evidenceHasError || data.evidence.length > 0 ? true : undefined} className="group rounded-lg border border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/25">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-700 marker:hidden dark:text-slate-300">
                            <span className="inline-flex items-center gap-2"><Paperclip size={14} aria-hidden="true" />Attachment <span className="font-normal text-slate-400">optional</span></span>
                            <span className="text-blue-700 group-open:hidden dark:text-blue-300">Add file</span>
                            <span className="hidden text-blue-700 group-open:inline dark:text-blue-300">Hide</span>
                        </summary>
                        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
                            <EvidenceFields files={data.evidence} onChange={(files) => setData('evidence', files)} errors={errors as Record<string, string | undefined>} disabled={processing} label="Work Request attachment" />
                        </div>
                    </details>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-700">
                        <Link href="/transactions" className="inline-flex min-h-10 items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Cancel</Link>
                        <button type="submit" disabled={processing || departments.length === 0 || requestTypes.length === 0 || actionOptions.length === 0} aria-busy={processing} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                            <Building2 size={16} aria-hidden="true" />
                            {processing ? 'Submitting…' : 'Submit Work Request'}
                            <ArrowRight size={16} aria-hidden="true" />
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
