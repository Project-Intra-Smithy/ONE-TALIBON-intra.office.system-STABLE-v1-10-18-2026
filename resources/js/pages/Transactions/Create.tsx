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

type TransactionCreateForm = {
    transaction_type: string;
    title: string;
    description: string;
    priority: string;
    target_department_id: number | '';
    due_at: string;
    remarks: string;
    evidence: File[];
};

const fieldClass = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:ring-blue-950/50';
const textareaClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:ring-blue-950/50';
const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300';
const labelTextClass = 'mb-1.5 block';

export default function Create({ departments }: { departments: Department[] }) {
    const executive = departments.filter((department) => department.branch !== 'legislative');
    const legislative = departments.filter((department) => department.branch === 'legislative');

    const { data, setData, post, processing, errors } = useForm<TransactionCreateForm>({
        transaction_type: 'internal_request',
        title: '',
        description: '',
        priority: 'normal',
        target_department_id: departments[0]?.id ?? '',
        due_at: '',
        remarks: '',
        evidence: [],
    });
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
                        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">Route accountable work to an active municipal office using the existing transaction workflow.</p>
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
                            <span className={labelTextClass}>Request type</span>
                            <select value={data.transaction_type} onChange={(event) => setData('transaction_type', event.target.value)} className={fieldClass}>
                                <option value="internal_request">Internal request</option>
                                <option value="project_endorsement">Project endorsement</option>
                                <option value="document_review">Document review</option>
                                <option value="funding_request">Funding request</option>
                                <option value="other">Other</option>
                            </select>
                            {errors.transaction_type && <span className="mt-1 block text-xs text-red-600">{errors.transaction_type}</span>}
                        </label>

                        <label className={labelClass}>
                            <span className={labelTextClass}>Priority</span>
                            <select value={data.priority} onChange={(event) => setData('priority', event.target.value)} className={fieldClass}>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </label>
                    </div>

                    <label className={labelClass}>
                        <span className={labelTextClass}>Subject</span>
                        <input value={data.title} onChange={(event) => setData('title', event.target.value)} className={fieldClass} placeholder="What requires action?" />
                        {errors.title && <span className="mt-1 block text-xs text-red-600">{errors.title}</span>}
                    </label>

                    <label className={labelClass}>
                        <span className={labelTextClass}>Description</span>
                        <textarea value={data.description} onChange={(event) => setData('description', event.target.value)} rows={3} className={textareaClass} placeholder="Context, required action, and supporting details" />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.45fr)_minmax(180px,.55fr)]">
                        <label className={labelClass}>
                            <span className={labelTextClass}>Receiving office</span>
                            <select value={data.target_department_id} onChange={(event) => setData('target_department_id', Number(event.target.value))} className={fieldClass}>
                                {executive.length > 0 && <optgroup label="Executive / Administrative">{executive.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</optgroup>}
                                {legislative.length > 0 && <optgroup label="Legislative Branch">{legislative.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</optgroup>}
                            </select>
                            {errors.target_department_id && <span className="mt-1 block text-xs text-red-600">{errors.target_department_id}</span>}
                        </label>

                        <label className={labelClass}>
                            <span className={labelTextClass}>Due date <span className="font-normal text-slate-400">optional</span></span>
                            <input type="date" value={data.due_at} onChange={(event) => setData('due_at', event.target.value)} className={fieldClass} />
                        </label>
                    </div>

                    <label className={labelClass}>
                        <span className={labelTextClass}>Routing remarks <span className="font-normal text-slate-400">optional</span></span>
                        <textarea value={data.remarks} onChange={(event) => setData('remarks', event.target.value)} rows={2} className={textareaClass} placeholder="Instructions for the receiving office" />
                    </label>

                    <details open={evidenceHasError || data.evidence.length > 0 ? true : undefined} className="group rounded-lg border border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/25">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-700 marker:hidden dark:text-slate-300">
                            <span className="inline-flex items-center gap-2"><Paperclip size={14} aria-hidden="true" />Supporting evidence <span className="font-normal text-slate-400">optional</span></span>
                            <span className="text-blue-700 group-open:hidden dark:text-blue-300">Add files</span>
                            <span className="hidden text-blue-700 group-open:inline dark:text-blue-300">Hide</span>
                        </summary>
                        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
                            <EvidenceFields
                                files={data.evidence}
                                onChange={(files) => setData('evidence', files)}
                                errors={errors as Record<string, string | undefined>}
                                disabled={processing}
                                label="Routing evidence / supporting files"
                            />
                        </div>
                    </details>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-700">
                        <Link href="/transactions" className="inline-flex min-h-10 items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">Cancel</Link>
                        <button
                            type="submit"
                            disabled={processing || departments.length === 0}
                            aria-busy={processing}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                        >
                            <Building2 size={16} aria-hidden="true" />
                            {processing ? 'Routing…' : 'Route Request'}
                            <ArrowRight size={16} aria-hidden="true" />
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
