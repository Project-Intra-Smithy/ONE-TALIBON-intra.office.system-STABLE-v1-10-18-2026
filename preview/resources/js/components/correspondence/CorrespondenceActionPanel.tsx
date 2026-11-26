import { Link, useForm } from '@inertiajs/react';
import { CheckCircle2, Play, Send, ShieldCheck } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import EvidenceFields from '../documents/EvidenceFields';
import { ConfirmDialog, DateInput } from '../ui';

export type CorrespondenceCapabilities = { canRegister: boolean; canClassify: boolean; canRoute: boolean; canAct: boolean };
export type CorrespondenceRouteOption = { id: number; code: string; name: string; shortName?: string | null };
type Props = {
    publicId: string;
    lifecycleState: string;
    capabilities: CorrespondenceCapabilities;
    routeOptions: CorrespondenceRouteOption[];
    linkedWorkflowUrl?: string | null;
};

const errorFor = (errors: unknown, key: string) => (errors as Record<string, string | undefined>)[key];

function ErrorText({ children }: { children?: string }) {
    return children ? <div role="alert" className="mt-1 text-xs font-semibold text-[var(--status-danger-fg)]">{children}</div> : null;
}

function ActionShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <section className="tcds-card border-l-4 border-l-[var(--brand-primary)] p-4 sm:p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                Required action
            </div>
            <h2 className="mt-1 text-base font-bold text-[var(--ink-primary)] sm:text-lg">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ink-secondary)]">{description}</p>
            <div className="mt-4">{children}</div>
        </section>
    );
}

export default function CorrespondenceActionPanel({ publicId, lifecycleState, capabilities, routeOptions, linkedWorkflowUrl }: Props) {
    const [confirmRegisterOpen, setConfirmRegisterOpen] = useState(false);
    const registerForm = useForm<{ evidence: File[] }>({ evidence: [] });
    const classifyForm = useForm<{ classification: string; remarks: string; evidence: File[] }>({ classification: 'internal', remarks: '', evidence: [] });
    const routeForm = useForm<{ target_department_id: number | ''; priority: 'normal' | 'high' | 'urgent'; due_at: string; remarks: string; evidence: File[] }>({
        target_department_id: routeOptions[0]?.id ?? '',
        priority: 'normal',
        due_at: '',
        remarks: '',
        evidence: [],
    });
    const actForm = useForm<{ remarks: string; evidence: File[] }>({ remarks: '', evidence: [] });

    const confirmRegister = () => {
        setConfirmRegisterOpen(false);
        registerForm.post(`/correspondence/${publicId}/workspace/register`, { preserveScroll: true, forceFormData: true });
    };
    const submitClassify = (e: FormEvent) => {
        e.preventDefault();
        classifyForm.post(`/correspondence/${publicId}/workspace/classify`, { preserveScroll: true, forceFormData: true });
    };
    const submitRoute = (e: FormEvent) => {
        e.preventDefault();
        routeForm.post(`/correspondence/${publicId}/workspace/route`, { preserveScroll: true, forceFormData: true });
    };
    const submitAct = (e: FormEvent) => {
        e.preventDefault();
        actForm.post(`/correspondence/${publicId}/workspace/act`, { preserveScroll: true, forceFormData: true });
    };

    if (capabilities.canRegister) {
        return (
            <ActionShell
                title="Register correspondence"
                description="Registration assigns the official municipal correspondence reference and moves this record into the municipal register."
            >
                <div className="space-y-3">
                    <EvidenceFields
                        files={registerForm.data.evidence}
                        onChange={(files) => registerForm.setData('evidence', files)}
                        errors={registerForm.errors as Record<string, string | undefined>}
                        disabled={registerForm.processing}
                        label="Registration evidence"
                    />
                    <ErrorText>{errorFor(registerForm.errors, 'correspondence')}</ErrorText>
                    <button
                        type="button"
                        disabled={registerForm.processing}
                        onClick={() => setConfirmRegisterOpen(true)}
                        className="municipal-primary-button"
                    >
                        <CheckCircle2 size={16} aria-hidden="true" />
                        <span>{registerForm.processing ? 'Registering…' : 'Register correspondence'}</span>
                    </button>
                </div>
                <ConfirmDialog
                    open={confirmRegisterOpen}
                    title="Register correspondence?"
                    message="This assigns an official municipal reference number and enters the record into the municipal register."
                    confirmLabel="Register correspondence"
                    onCancel={() => setConfirmRegisterOpen(false)}
                    onConfirm={confirmRegister}
                />
            </ActionShell>
        );
    }

    if (capabilities.canClassify) {
        const sensitive = ['confidential', 'restricted'].includes(classifyForm.data.classification);
        return (
            <ActionShell title="Classify correspondence" description="Choose the municipal access classification for this registered correspondence.">
                <form onSubmit={submitClassify} className="space-y-3">
                    <label className="block text-sm font-semibold text-[var(--ink-primary)]">
                        Classification
                        <select value={classifyForm.data.classification} onChange={(e) => classifyForm.setData('classification', e.target.value)} className="tcds-input mt-1.5">
                            <option value="public">Public</option>
                            <option value="internal">Internal</option>
                            <option value="confidential">Confidential</option>
                            <option value="restricted">Restricted</option>
                        </select>
                        <ErrorText>{classifyForm.errors.classification}</ErrorText>
                    </label>
                    {sensitive && (
                        <div className="flex items-start gap-2 rounded-lg border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] px-3 py-2 text-xs leading-5 text-[var(--status-warn-fg)]">
                            <ShieldCheck size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
                            <span>This classification limits who can view and act on the correspondence and linked evidence.</span>
                        </div>
                    )}
                    <label className="block text-sm font-semibold text-[var(--ink-primary)]">
                        Remarks <span className="text-xs font-normal text-[var(--ink-secondary)]">(optional)</span>
                        <textarea value={classifyForm.data.remarks} onChange={(e) => classifyForm.setData('remarks', e.target.value)} rows={3} className="tcds-input mt-1.5" placeholder="Classification note" />
                        <ErrorText>{classifyForm.errors.remarks}</ErrorText>
                    </label>
                    <EvidenceFields files={classifyForm.data.evidence} onChange={(files) => classifyForm.setData('evidence', files)} errors={classifyForm.errors as Record<string, string | undefined>} disabled={classifyForm.processing} label="Classification evidence" />
                    <ErrorText>{errorFor(classifyForm.errors, 'correspondence')}</ErrorText>
                    <button type="submit" disabled={classifyForm.processing} className="municipal-primary-button">
                        {classifyForm.processing ? 'Saving…' : 'Save classification'}
                    </button>
                </form>
            </ActionShell>
        );
    }

    if (capabilities.canRoute) {
        return (
            <ActionShell title="Route correspondence" description="Send this classified correspondence to the office responsible for the next action.">
                <form onSubmit={submitRoute} className="space-y-3">
                    <label className="block text-sm font-semibold text-[var(--ink-primary)]">
                        Destination office
                        <select value={routeForm.data.target_department_id} onChange={(e) => routeForm.setData('target_department_id', e.target.value ? Number(e.target.value) : '')} className="tcds-input mt-1.5">
                            {routeOptions.length === 0 && <option value="">No valid destination available</option>}
                            {routeOptions.map((office) => <option key={office.id} value={office.id}>{office.shortName || office.name}</option>)}
                        </select>
                        <ErrorText>{routeForm.errors.target_department_id}</ErrorText>
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm font-semibold text-[var(--ink-primary)]">
                            Priority
                            <select value={routeForm.data.priority} onChange={(e) => routeForm.setData('priority', e.target.value as 'normal' | 'high' | 'urgent')} className="tcds-input mt-1.5">
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                            <ErrorText>{routeForm.errors.priority}</ErrorText>
                        </label>
                        <div className="block text-sm font-semibold text-[var(--ink-primary)]">
                            <label htmlFor="corr-route-due" className="mb-1.5 block">
                                Due date <span className="text-xs font-normal text-[var(--ink-secondary)]">(optional)</span>
                            </label>
                            <DateInput
                                id="corr-route-due"
                                value={routeForm.data.due_at}
                                onChange={(next) => routeForm.setData('due_at', next)}
                                presets="deadline"
                            />
                            <ErrorText>{routeForm.errors.due_at}</ErrorText>
                        </div>
                    </div>
                    <label className="block text-sm font-semibold text-[var(--ink-primary)]">
                        Remarks <span className="text-xs font-normal text-[var(--ink-secondary)]">(optional)</span>
                        <textarea value={routeForm.data.remarks} onChange={(e) => routeForm.setData('remarks', e.target.value)} rows={3} className="tcds-input mt-1.5" placeholder="Instructions for the receiving office" />
                        <ErrorText>{routeForm.errors.remarks}</ErrorText>
                    </label>
                    <EvidenceFields files={routeForm.data.evidence} onChange={(files) => routeForm.setData('evidence', files)} errors={routeForm.errors as Record<string, string | undefined>} disabled={routeForm.processing} label="Routing evidence" />
                    <ErrorText>{errorFor(routeForm.errors, 'correspondence')}</ErrorText>
                    <button type="submit" disabled={routeForm.processing || routeOptions.length === 0} className="municipal-primary-button">
                        <Send size={15} aria-hidden="true" />
                        <span>{routeForm.processing ? 'Routing…' : 'Route correspondence'}</span>
                    </button>
                </form>
            </ActionShell>
        );
    }

    if (capabilities.canAct) {
        return (
            <ActionShell title="Start action" description="Formally mark that the authorized receiving office or responsible person has begun work on this correspondence.">
                <form onSubmit={submitAct} className="space-y-3">
                    <label className="block text-sm font-semibold text-[var(--ink-primary)]">
                        Remarks <span className="text-xs font-normal text-[var(--ink-secondary)]">(optional)</span>
                        <textarea value={actForm.data.remarks} onChange={(e) => actForm.setData('remarks', e.target.value)} rows={3} className="tcds-input mt-1.5" placeholder="Initial action note" />
                    </label>
                    <EvidenceFields files={actForm.data.evidence} onChange={(files) => actForm.setData('evidence', files)} errors={actForm.errors as Record<string, string | undefined>} disabled={actForm.processing} label="Action evidence / photos" />
                    <ErrorText>{errorFor(actForm.errors, 'correspondence') || errorFor(actForm.errors, 'workflow')}</ErrorText>
                    <button type="submit" disabled={actForm.processing} className="municipal-primary-button">
                        <Play size={15} aria-hidden="true" />
                        <span>{actForm.processing ? 'Starting…' : 'Start action'}</span>
                    </button>
                </form>
            </ActionShell>
        );
    }

    if (lifecycleState === 'routed' && linkedWorkflowUrl) {
        return (
            <section className="tcds-card p-4 sm:p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">Next step</div>
                <div className="mt-1 text-base font-bold text-[var(--ink-primary)]">Prepare the linked workflow for action</div>
                <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                    This correspondence is routed but is not yet actionable. Open the linked workflow to complete the assignment or review step.
                </p>
                <Link href={linkedWorkflowUrl} className="municipal-secondary-button mt-3">
                    Open linked workflow
                </Link>
            </section>
        );
    }

    return null;
}
