import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';
import type { FormEvent } from 'react';
import { allowedMemoAudiences, type Audience } from '../../compat/uiContracts';
import { PageHeader } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';

type Dept = { id: number; name: string; short_name?: string };
type Employee = { id: number; employee_number: string; position_title: string; department_id: number; user: { name: string; email: string } };

export default function Create({
    departments = [],
    employees = [],
    suggestedMemoNumber,
    authority,
}: {
    departments: Dept[];
    employees: Employee[];
    suggestedMemoNumber: string;
    authority: { canPublish: boolean; allowedAudienceTypes: Audience[] };
}) {
    const allowed = allowedMemoAudiences(authority?.allowedAudienceTypes);
    const initialAudience = allowed[0] ?? 'departments';
    const form = useForm<{
        memo_number: string;
        title: string;
        body: string;
        audience_type: Audience;
        audience_ids: number[];
        requires_acknowledgement: boolean;
        classification: string;
        expires_at: string;
    }>({
        memo_number: suggestedMemoNumber ?? '',
        title: '',
        body: '',
        audience_type: initialAudience,
        audience_ids: [],
        requires_acknowledgement: true,
        classification: 'internal',
        expires_at: '',
    });

    const toggle = (id: number) =>
        form.setData(
            'audience_ids',
            form.data.audience_ids.includes(id)
                ? form.data.audience_ids.filter((x) => x !== id)
                : [...form.data.audience_ids, id],
        );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (
            form.processing
            || !authority?.canPublish
            || !allowed.includes(form.data.audience_type)
            || !form.data.memo_number.trim()
            || (form.data.audience_type !== 'all' && form.data.audience_ids.length === 0)
        ) {
            return;
        }
        form.post('/memoranda');
    };

    const formErrors = Object.values(form.errors).filter((message): message is string => typeof message === 'string');

    return (
        <AppLayout title="Publish Memorandum">
            <div className="civic-page mx-auto max-w-3xl space-y-4">
                <PageHeader
                    eyebrow="Central issuance"
                    title="Publish Memorandum"
                    subtitle="Recipients are resolved at publication time so delivery and acknowledgement remain auditable."
                    actions={
                        <Link href="/memoranda" className="municipal-secondary-button">
                            <ArrowLeft size={15} aria-hidden="true" />
                            <span>Back to Memoranda</span>
                        </Link>
                    }
                />

                <form onSubmit={submit} className="tcds-card space-y-4 p-5 sm:p-6">
                    {formErrors.length > 0 && (
                        <div
                            role="alert"
                            className="rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-fg)]"
                        >
                            <div className="font-semibold">The memorandum could not be published.</div>
                            <ul className="mt-1 list-disc space-y-1 pl-5">
                                {formErrors.map((message, index) => (
                                    <li key={`${message}-${index}`}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Memo number</span>
                            <input
                                disabled={form.processing}
                                value={form.data.memo_number}
                                onChange={(e) => form.setData('memo_number', e.target.value)}
                                placeholder="e.g., MEMO-2026-014"
                                className="tcds-input font-mono"
                            />
                            {form.errors.memo_number && <span className="mt-1 block text-xs font-semibold text-[var(--status-danger-fg)]">{form.errors.memo_number}</span>}
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Classification</span>
                            <select
                                disabled={form.processing}
                                value={form.data.classification}
                                onChange={(e) => form.setData('classification', e.target.value)}
                                className="tcds-input"
                            >
                                <option value="internal">Internal</option>
                                <option value="public">Public</option>
                                <option value="confidential">Confidential</option>
                            </select>
                            {form.errors.classification && <span className="mt-1 block text-xs font-semibold text-[var(--status-danger-fg)]">{form.errors.classification}</span>}
                        </label>
                    </div>

                    <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Title</span>
                        <input
                            disabled={form.processing}
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                            placeholder="Concise subject of the official memorandum"
                            className="tcds-input"
                        />
                        {form.errors.title && <span className="mt-1 block text-xs font-semibold text-[var(--status-danger-fg)]">{form.errors.title}</span>}
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Memorandum content</span>
                        <textarea
                            disabled={form.processing}
                            rows={7}
                            value={form.data.body}
                            onChange={(e) => form.setData('body', e.target.value)}
                            className="tcds-input min-h-36 resize-y"
                        />
                        {form.errors.body && <span className="mt-1 block text-xs font-semibold text-[var(--status-danger-fg)]">{form.errors.body}</span>}
                    </label>

                    <div>
                        <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Audience</div>
                        {allowed.length === 0 && (
                            <p role="alert" className="rounded-lg border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] px-3 py-2 text-xs font-semibold text-[var(--status-warn-fg)]">
                                Publishing authority is unavailable for your current preview role.
                            </p>
                        )}
                        <div className="grid gap-2 sm:grid-cols-3">
                            {allowed.map((type) => (
                                <button
                                    type="button"
                                    disabled={form.processing}
                                    key={type}
                                    onClick={() => form.setData({ ...form.data, audience_type: type, audience_ids: [] })}
                                    className={`min-h-11 rounded-lg border px-3.5 py-2 text-sm font-semibold capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                        form.data.audience_type === type
                                            ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                            : 'border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]'
                                    }`}
                                >
                                    {type === 'all' ? 'All Employees' : type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {form.data.audience_type === 'departments' && (
                        <div className="grid max-h-56 gap-2 overflow-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3 sm:grid-cols-2">
                            {departments.map((d) => (
                                <label key={d.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-2.5 text-sm text-[var(--ink-primary)]">
                                    <input disabled={form.processing} type="checkbox" checked={form.data.audience_ids.includes(d.id)} onChange={() => toggle(d.id)} className="h-4 w-4 accent-[var(--brand-primary)]" />
                                    <span>{d.name}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {form.data.audience_type === 'employees' && (
                        <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3">
                            {employees.map((employee) => (
                                <label key={employee.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-2.5 text-sm text-[var(--ink-primary)]">
                                    <input disabled={form.processing} type="checkbox" checked={form.data.audience_ids.includes(employee.id)} onChange={() => toggle(employee.id)} className="h-4 w-4 accent-[var(--brand-primary)]" />
                                    <span>
                                        <strong>{employee.user.name}</strong>
                                        <span className="ml-2 text-xs text-[var(--ink-secondary)]">{employee.employee_number} · {employee.position_title}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}

                    {form.errors.audience_ids && <div className="text-xs font-semibold text-[var(--status-danger-fg)]">{form.errors.audience_ids}</div>}

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm font-semibold text-[var(--ink-primary)]">
                        <input
                            disabled={form.processing}
                            type="checkbox"
                            checked={form.data.requires_acknowledgement}
                            onChange={(e) => form.setData('requires_acknowledgement', e.target.checked)}
                            className="h-4 w-4 accent-[var(--brand-primary)]"
                        />
                        <span>Require employee acknowledgement</span>
                    </label>

                    <div className="flex flex-wrap justify-end gap-2.5 border-t border-[var(--border-default)] pt-4">
                        <Link href="/memoranda" className="municipal-secondary-button">Cancel</Link>
                        <button
                            type="submit"
                            disabled={
                                form.processing
                                || !authority?.canPublish
                                || allowed.length === 0
                                || !form.data.memo_number.trim()
                                || (form.data.audience_type !== 'all' && form.data.audience_ids.length === 0)
                            }
                            aria-busy={form.processing}
                            className="municipal-primary-button disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Send size={15} aria-hidden="true" />
                            <span>{form.processing ? 'Publishing…' : 'Publish & Deliver'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
