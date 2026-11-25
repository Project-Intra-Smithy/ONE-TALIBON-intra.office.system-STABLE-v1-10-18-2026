import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { DateInput } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';

export default function Create() {
    const form = useForm({ record_type: 'ordinance', record_number: '', title: '', summary: '', approved_at: '', status: 'active', issuing_body: 'Sangguniang Bayan', keywords: '' });
    const submit = (e: FormEvent) => { e.preventDefault(); form.post('/legislation'); };

    return (
        <AppLayout title="Add Municipal Record">
            <div data-density="compact" className="portal-page civic-page mx-auto max-w-3xl">
                <Link href="/legislation" className="text-xs font-semibold text-[var(--brand-ink)] sm:text-sm">← Back to Ordinances & Issuances</Link>
                <h1 className="mt-2 text-2xl font-bold text-[var(--ink-primary)] sm:mt-3 sm:text-3xl">Add municipal issuance or legislative record</h1>
                <p className="mt-1.5 text-xs text-[var(--ink-secondary)] sm:text-sm">Records entered here become searchable from the shared municipal repository.</p>
                <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-sm sm:mt-6 sm:space-y-5 sm:p-6 md:p-8">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label><span className="mb-1.5 block text-xs font-semibold text-[var(--ink-primary)] sm:text-sm">Type</span><select value={form.data.record_type} onChange={(e) => form.setData('record_type', e.target.value)} className="tcds-input"><option value="ordinance">Ordinance</option><option value="resolution">Resolution</option><option value="executive_order">Executive Order</option><option value="office_order">Office Order</option><option value="administrative_order">Administrative Order</option><option value="circular">Circular</option><option value="other">Other</option></select></label>
                        <label><span className="mb-1.5 block text-xs font-semibold text-[var(--ink-primary)] sm:text-sm">Record number</span><input value={form.data.record_number} onChange={(e) => form.setData('record_number', e.target.value)} className="tcds-input" placeholder="e.g. ORD-2026-014" /></label>
                    </div>
                    <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[var(--ink-primary)] sm:text-sm">Title</span><input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className="tcds-input" /></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[var(--ink-primary)] sm:text-sm">Summary</span><textarea rows={5} value={form.data.summary} onChange={(e) => form.setData('summary', e.target.value)} className="tcds-input min-h-28 resize-y" /></label>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div><label htmlFor="leg-approved-at" className="mb-1.5 block text-xs font-semibold text-[var(--ink-primary)] sm:text-sm">Approved / issued date</label><DateInput id="leg-approved-at" value={form.data.approved_at} onChange={(next) => form.setData('approved_at', next)} /></div>
                        <label><span className="mb-1.5 block text-xs font-semibold text-[var(--ink-primary)] sm:text-sm">Status</span><select value={form.data.status} onChange={(e) => form.setData('status', e.target.value)} className="tcds-input"><option value="active">Active</option><option value="superseded">Superseded</option><option value="repealed">Repealed</option><option value="archived">Archived</option></select></label>
                    </div>
                    <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[var(--ink-primary)] sm:text-sm">Issuing body / office</span><input value={form.data.issuing_body} onChange={(e) => form.setData('issuing_body', e.target.value)} className="tcds-input" placeholder="Sangguniang Bayan or Mayor's Office" /></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[var(--ink-primary)] sm:text-sm">Keywords</span><input value={form.data.keywords} onChange={(e) => form.setData('keywords', e.target.value)} className="tcds-input" placeholder="infrastructure, road, budget" /></label>
                    <div className="flex justify-end gap-2 sm:gap-3"><Link href="/legislation" className="municipal-secondary-button">Cancel</Link><button disabled={form.processing} className="municipal-primary-button">Save record</button></div>
                </form>
            </div>
        </AppLayout>
    );
}
