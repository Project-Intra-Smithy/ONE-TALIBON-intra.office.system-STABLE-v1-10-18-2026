import { Link, useForm } from '@inertiajs/react';
import { Building2, FileText, ShieldCheck, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';

type Dept = { id: number; code: string; name: string; short_name?: string | null };
type Employee = { id: number; employee_number: string; position_title: string; department_id: number; user: { name: string; email: string } };
type Authority = {
    canPublish: boolean;
    scope: 'department' | 'municipal';
    issuingOffice: { id: number; code: string; name: string; shortName?: string | null };
    allowedAudienceTypes: Array<'all' | 'departments' | 'employees'>;
    municipalityWide: boolean;
    memoPrefix: string;
    authorityLabel: string;
};

type FormData = {
    memo_number: string;
    title: string;
    body: string;
    audience_type: 'all' | 'departments' | 'employees';
    audience_ids: number[];
    requires_acknowledgement: boolean;
    classification: string;
    expires_at: string;
};

export default function Create({ authority, departments, employees, suggestedMemoNumber }: { authority: Authority; departments: Dept[]; employees: Employee[]; suggestedMemoNumber: string }) {
    const initialAudience: FormData['audience_type'] = authority.scope === 'department' ? 'departments' : 'all';
    const initialIds = authority.scope === 'department' ? [authority.issuingOffice.id] : [];

    const form = useForm<FormData>({
        memo_number: suggestedMemoNumber,
        title: '',
        body: '',
        audience_type: initialAudience,
        audience_ids: initialIds,
        requires_acknowledgement: true,
        classification: 'internal',
        expires_at: '',
    });

    const toggle = (id: number) => form.setData('audience_ids', form.data.audience_ids.includes(id)
        ? form.data.audience_ids.filter((item) => item !== id)
        : [...form.data.audience_ids, id]);

    const selectAudience = (type: FormData['audience_type']) => {
        if (!authority.allowedAudienceTypes.includes(type)) return;

        form.setData({
            ...form.data,
            audience_type: type,
            audience_ids: authority.scope === 'department' && type === 'departments'
                ? [authority.issuingOffice.id]
                : [],
        });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!form.processing) form.post('/memoranda');
    };

    const formErrors = Object.values(form.errors).filter((message): message is string => typeof message === 'string');
    const fieldClass = 'min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 text-xs text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 disabled:opacity-60';

    return (
        <AppLayout title="New Memorandum">
            <PageFrame width="standard" density="compact">
                <PageHeader
                    eyebrow="Formal internal issuance"
                    title="New Memorandum"
                    description="Publish a numbered memorandum within the authority of the issuing office."
                    icon={FileText}
                />

                <section className="municipal-panel p-3" aria-label="Issuing authority">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand)]">
                            <ShieldCheck size={17} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Issuing authority</div>
                            <div className="mt-0.5 text-sm font-bold text-[var(--municipal-text)]">{authority.issuingOffice.name}</div>
                            <div className="mt-0.5 text-[10px] text-[var(--municipal-muted)]">
                                {authority.authorityLabel}
                                {authority.scope === 'department' ? ' · Office-scoped memorandum' : ' · Municipality-wide authority available'}
                            </div>
                        </div>
                    </div>
                </section>

                <form onSubmit={submit} className="municipal-panel space-y-3 p-3">
                    {formErrors.length > 0 ? (
                        <div role="alert" className="rounded-md border border-[#edc9cd] bg-[#fff0f1] px-3 py-2 text-[11px] text-[#9f343e]">
                            <div className="font-bold">The memorandum could not be published.</div>
                            <ul className="mt-1 list-disc space-y-0.5 pl-4">{formErrors.map((message, index) => <li key={message + index}>{message}</li>)}</ul>
                        </div>
                    ) : null}

                    <div className="grid gap-2 md:grid-cols-2">
                        <label className="block">
                            <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Memo number</span>
                            <input disabled={form.processing} value={form.data.memo_number} onChange={(event) => form.setData('memo_number', event.target.value)} className={fieldClass} />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Classification</span>
                            <select disabled={form.processing} value={form.data.classification} onChange={(event) => form.setData('classification', event.target.value)} className={fieldClass}>
                                <option value="internal">Internal</option>
                                <option value="public">Public</option>
                                <option value="confidential">Confidential</option>
                            </select>
                        </label>
                    </div>

                    <label className="block">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Title</span>
                        <input disabled={form.processing} value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} className={fieldClass} placeholder="Memorandum subject" />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Memorandum</span>
                        <textarea disabled={form.processing} rows={9} value={form.data.body} onChange={(event) => form.setData('body', event.target.value)} className={fieldClass + ' py-2 leading-5'} placeholder="Formal memorandum content..." />
                    </label>

                    <section aria-labelledby="memo-audience">
                        <div className="mb-1.5">
                            <h2 id="memo-audience" className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Recipients</h2>
                            <p className="text-[9px] text-[var(--municipal-muted)]">Audience options are constrained by the issuing authority.</p>
                        </div>

                        <div className="grid gap-1.5 sm:grid-cols-3">
                            {authority.allowedAudienceTypes.includes('all') ? (
                                <button type="button" onClick={() => selectAudience('all')} className={`min-h-12 rounded-md border px-3 text-left ${form.data.audience_type === 'all' ? 'border-[var(--municipal-selected-border)] bg-[var(--municipal-selected-bg)] text-[var(--municipal-brand)]' : 'border-[var(--municipal-border)]'}`}>
                                    <div className="text-[11px] font-bold">All municipal employees</div>
                                    <div className="text-[9px] opacity-75">Municipality-wide delivery</div>
                                </button>
                            ) : null}

                            {authority.allowedAudienceTypes.includes('departments') ? (
                                <button type="button" onClick={() => selectAudience('departments')} className={`min-h-12 rounded-md border px-3 text-left ${form.data.audience_type === 'departments' ? 'border-[var(--municipal-selected-border)] bg-[var(--municipal-selected-bg)] text-[var(--municipal-brand)]' : 'border-[var(--municipal-border)]'}`}>
                                    <div className="text-[11px] font-bold">{authority.scope === 'department' ? 'Entire issuing office' : 'Selected departments'}</div>
                                    <div className="text-[9px] opacity-75">{authority.scope === 'department' ? authority.issuingOffice.name : 'Choose one or more offices'}</div>
                                </button>
                            ) : null}

                            {authority.allowedAudienceTypes.includes('employees') ? (
                                <button type="button" onClick={() => selectAudience('employees')} className={`min-h-12 rounded-md border px-3 text-left ${form.data.audience_type === 'employees' ? 'border-[var(--municipal-selected-border)] bg-[var(--municipal-selected-bg)] text-[var(--municipal-brand)]' : 'border-[var(--municipal-border)]'}`}>
                                    <div className="text-[11px] font-bold">Selected employees</div>
                                    <div className="text-[9px] opacity-75">{authority.scope === 'department' ? 'Within your issuing office' : 'Authorized employee recipients'}</div>
                                </button>
                            ) : null}
                        </div>
                    </section>

                    {form.data.audience_type === 'departments' && authority.scope === 'municipal' ? (
                        <div className="grid max-h-48 gap-1.5 overflow-auto rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] p-2 sm:grid-cols-2">
                            {departments.map((department) => (
                                <label key={department.id} className="flex min-h-9 items-center gap-2 rounded-md bg-[var(--municipal-surface)] px-2.5 text-[10px]">
                                    <input disabled={form.processing} type="checkbox" checked={form.data.audience_ids.includes(department.id)} onChange={() => toggle(department.id)} />
                                    <Building2 size={12} className="text-[var(--municipal-muted)]" aria-hidden="true" />
                                    <span className="truncate">{department.short_name || department.name}</span>
                                </label>
                            ))}
                        </div>
                    ) : null}

                    {form.data.audience_type === 'departments' && authority.scope === 'department' ? (
                        <div className="rounded-md border border-[#cfe6d5] bg-[#eef8f1] px-3 py-2 text-[10px] text-[#17633f]">
                            This memorandum will be delivered only to active employee accounts in <strong>{authority.issuingOffice.name}</strong>.
                        </div>
                    ) : null}

                    {form.data.audience_type === 'employees' ? (
                        <div className="max-h-52 space-y-1 overflow-auto rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] p-2">
                            {employees.map((employee) => (
                                <label key={employee.id} className="flex min-h-9 items-center gap-2 rounded-md bg-[var(--municipal-surface)] px-2.5 text-[10px]">
                                    <input disabled={form.processing} type="checkbox" checked={form.data.audience_ids.includes(employee.id)} onChange={() => toggle(employee.id)} />
                                    <Users size={12} className="text-[var(--municipal-muted)]" aria-hidden="true" />
                                    <span className="min-w-0 flex-1 truncate"><strong>{employee.user.name}</strong> · {employee.position_title}</span>
                                </label>
                            ))}
                        </div>
                    ) : null}

                    <div className="grid gap-2 border-t border-[var(--municipal-border)] pt-3 md:grid-cols-[1fr_240px]">
                        <label className="flex items-start gap-2 rounded-md border border-[#cfe0f6] bg-[#eef5ff] p-2.5 text-[10px] text-[#265fa8]">
                            <input disabled={form.processing} type="checkbox" checked={form.data.requires_acknowledgement} onChange={(event) => form.setData('requires_acknowledgement', event.target.checked)} className="mt-0.5" />
                            <span><strong className="block text-[11px]">Require acknowledgement</strong><span className="block opacity-80">Recipients must explicitly acknowledge receipt.</span></span>
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Expiry (optional)</span>
                            <input type="datetime-local" disabled={form.processing} value={form.data.expires_at} onChange={(event) => form.setData('expires_at', event.target.value)} className={fieldClass} />
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-[var(--municipal-border)] pt-3">
                        <Link href="/memoranda" className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--municipal-border)] px-3 text-xs font-semibold text-[var(--municipal-text)]">Cancel</Link>
                        <button type="submit" disabled={form.processing} className="min-h-10 rounded-md bg-[var(--municipal-brand-deep)] px-4 text-xs font-bold text-white disabled:opacity-60">{form.processing ? 'Publishing...' : 'Publish & Deliver'}</button>
                    </div>
                </form>
            </PageFrame>
        </AppLayout>
    );
}
