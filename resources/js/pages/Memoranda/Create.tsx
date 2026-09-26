import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '../../layouts/AppLayout';

type Dept = { id: number; name: string; short_name?: string };
type Employee = { id: number; employee_number: string; position_title: string; department_id: number; user: { name: string; email: string } };

export default function Create({ departments, employees }: { departments: Dept[]; employees: Employee[] }) {
    const form = useForm<{ memo_number: string; title: string; body: string; audience_type: 'all' | 'departments' | 'employees'; audience_ids: number[]; requires_acknowledgement: boolean; classification: string; expires_at: string }>({
        memo_number: 'MEMO-2026-' + String(Math.floor(Math.random() * 900) + 100),
        title: '',
        body: '',
        audience_type: 'all',
        audience_ids: [],
        requires_acknowledgement: true,
        classification: 'internal',
        expires_at: '',
    });
    const toggle = (id: number) => form.setData('audience_ids', form.data.audience_ids.includes(id) ? form.data.audience_ids.filter((item) => item !== id) : [...form.data.audience_ids, id]);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (form.processing) return;
        form.post('/memoranda');
    };
    const formErrors = Object.values(form.errors).filter((message): message is string => typeof message === 'string');
    const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

    return <AppLayout title="Publish Official Memorandum"><div className="mx-auto max-w-3xl">
        <Link href="/memoranda" className="text-sm font-semibold text-blue-700 dark:text-blue-300">← Back to Official Memoranda</Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-100">Publish official memorandum</h1>
        <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">Create a formal numbered internal issuance. Recipients are resolved at publication time so delivery and acknowledgement remain auditable.</p>

        <form onSubmit={submit} className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-[#142236]">
            {formErrors.length > 0 && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><div className="font-semibold">The memorandum could not be published.</div><ul className="mt-1 list-disc space-y-1 pl-5">{formErrors.map((message, index) => <li key={message + '-' + index}>{message}</li>)}</ul></div>}

            <div className="grid gap-3 md:grid-cols-2">
                <label><span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Memo number</span><input disabled={form.processing} value={form.data.memo_number} onChange={(event) => form.setData('memo_number', event.target.value)} className={fieldClass} />{form.errors.memo_number && <span className="mt-1 block text-sm text-red-600">{form.errors.memo_number}</span>}</label>
                <label><span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Classification</span><select disabled={form.processing} value={form.data.classification} onChange={(event) => form.setData('classification', event.target.value)} className={fieldClass}><option value="internal">Internal</option><option value="public">Public</option><option value="confidential">Confidential</option></select>{form.errors.classification && <span className="mt-1 block text-sm text-red-600">{form.errors.classification}</span>}</label>
            </div>

            <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Title</span><input disabled={form.processing} value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} className={fieldClass} />{form.errors.title && <span className="mt-1 block text-sm text-red-600">{form.errors.title}</span>}</label>
            <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Memorandum content</span><textarea disabled={form.processing} rows={8} value={form.data.body} onChange={(event) => form.setData('body', event.target.value)} className={fieldClass} />{form.errors.body && <span className="mt-1 block text-sm text-red-600">{form.errors.body}</span>}</label>

            <section aria-labelledby="memorandum-audience-heading">
                <div id="memorandum-audience-heading" className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Recipient audience</div>
                <div className="grid gap-2 sm:grid-cols-3">
                    {(['all', 'departments', 'employees'] as const).map((type) => <button type="button" disabled={form.processing} key={type} onClick={() => form.setData({ ...form.data, audience_type: type, audience_ids: [] })} className={'min-h-10 rounded-lg border px-3 py-2 text-sm font-semibold capitalize disabled:cursor-not-allowed disabled:opacity-60 ' + (form.data.audience_type === type ? 'border-blue-700 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300')}>{type === 'all' ? 'All Employees' : type}</button>)}
                </div>
            </section>

            {form.data.audience_type === 'departments' && <div className="grid max-h-56 gap-2 overflow-auto rounded-lg bg-slate-50 p-2.5 sm:grid-cols-2 dark:bg-slate-900/40">{departments.map((department) => <label key={department.id} className="flex items-center gap-3 rounded-lg bg-white p-2.5 text-sm dark:bg-[#142236]"><input disabled={form.processing} type="checkbox" checked={form.data.audience_ids.includes(department.id)} onChange={() => toggle(department.id)} />{department.name}</label>)}</div>}
            {form.data.audience_type === 'employees' && <div className="max-h-64 space-y-2 overflow-auto rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900/40">{employees.map((employee) => <label key={employee.id} className="flex items-center gap-3 rounded-lg bg-white p-2.5 text-sm dark:bg-[#142236]"><input disabled={form.processing} type="checkbox" checked={form.data.audience_ids.includes(employee.id)} onChange={() => toggle(employee.id)} /><span><strong>{employee.user.name}</strong><span className="ml-2 text-slate-500 dark:text-slate-400">{employee.employee_number} · {employee.position_title}</span></span></label>)}</div>}
            {form.errors.audience_ids && <div className="text-sm text-red-600">{form.errors.audience_ids}</div>}

            <div className="grid gap-3 md:grid-cols-[1fr_240px]">
                <label className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200"><input disabled={form.processing} type="checkbox" checked={form.data.requires_acknowledgement} onChange={(event) => form.setData('requires_acknowledgement', event.target.checked)} className="mt-0.5" /><span><strong className="block">Require employee acknowledgement</strong><span className="mt-0.5 block text-xs font-normal">Recipients must record acknowledgement against this issuance.</span></span></label>
                <label><span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Expiry <span className="font-normal text-slate-400">(optional)</span></span><input type="datetime-local" disabled={form.processing} value={form.data.expires_at} onChange={(event) => form.setData('expires_at', event.target.value)} className={fieldClass} />{form.errors.expires_at && <span className="mt-1 block text-sm text-red-600">{form.errors.expires_at}</span>}</label>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-700">
                <Link href="/memoranda" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Cancel</Link>
                <button type="submit" disabled={form.processing} aria-busy={form.processing} className="min-h-10 rounded-lg bg-[#0b2852] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{form.processing ? 'Publishing…' : 'Publish & Deliver'}</button>
            </div>
        </form>
    </div></AppLayout>;
}
