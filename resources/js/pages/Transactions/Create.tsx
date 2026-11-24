import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Building2, Paperclip } from 'lucide-react';
import EvidenceFields from '../../components/documents/EvidenceFields';
import OfficeCombobox from '../../components/portal/OfficeCombobox';
import { DateInput, ErrorSummary, FormField, PageHeader, RadioCardGroup } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { humanizeSlug } from '../../lib/format';

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

export type WorkRequestCreateProps = {
    departments: Department[];
    assignableEmployees: Employee[];
    requestCategories: Record<string, string[]>;
    actionOptions: string[];
    onCancel?: () => void;
    compact?: boolean;
    formId?: string;
    hideFooter?: boolean;
};

const PRIORITY_OPTIONS = [
    { value: 'normal', label: 'Normal', description: 'Standard queue' },
    { value: 'high', label: 'High', description: 'Priority review' },
    { value: 'urgent', label: 'Urgent', description: 'Immediate action' },
];

/** Reusable GOV.UK/TCDS accessible Work Request form used both on /transactions/create and in the slide-over drawer. */
export function WorkRequestCreateForm({
    departments,
    assignableEmployees,
    requestCategories,
    actionOptions,
    onCancel,
    compact = false,
    formId,
    hideFooter = false,
}: WorkRequestCreateProps) {
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
    const selectedEmployees = assignableEmployees.filter(
        (employee) => employee.department_id === Number(data.target_department_id),
    );
    const evidenceHasError = Object.keys(errors).some((key) => key === 'evidence' || key.startsWith('evidence.'));

    return (
        <form
            id={formId}
            onSubmit={(event) => {
                event.preventDefault();
                if (processing) return;
                post('/transactions', { forceFormData: true });
            }}
            className="space-y-4"
            aria-label="Create Work Request"
            aria-busy={processing}
        >
            <ErrorSummary errors={errors as Record<string, string | undefined>} title="The work request could not be routed" />

            <div className={compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
                <FormField label="Request Category" htmlFor="wr-category" required error={errors.request_category}>
                    <select
                        id="wr-category"
                        name="request_category"
                        value={data.request_category}
                        onChange={(event) => {
                            const category = event.target.value;
                            setData('request_category', category);
                            setData('request_type', requestCategories[category]?.[0] ?? '');
                        }}
                        className="tcds-input"
                        required
                    >
                        {categoryNames.map((category) => (
                            <option key={category} value={category}>
                                {humanizeSlug(category)}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Request Type" htmlFor="wr-type" required error={errors.request_type}>
                    <select
                        id="wr-type"
                        name="request_type"
                        value={data.request_type}
                        onChange={(event) => setData('request_type', event.target.value)}
                        className="tcds-input"
                        required
                    >
                        {requestTypes.map((requestType) => (
                            <option key={requestType} value={requestType}>
                                {requestType}
                            </option>
                        ))}
                    </select>
                </FormField>
            </div>

            <FormField label="Action Required" htmlFor="wr-action" required error={errors.action_required}>
                <select
                    id="wr-action"
                    name="action_required"
                    value={data.action_required}
                    onChange={(event) => setData('action_required', event.target.value)}
                    className="tcds-input"
                    required
                >
                    {actionOptions.map((action) => (
                        <option key={action} value={action}>
                            {action}
                        </option>
                    ))}
                </select>
            </FormField>

            <div className="space-y-4">
                <OfficeCombobox
                    offices={departments}
                    value={data.target_department_id}
                    disabled={processing}
                    error={errors.target_department_id}
                    onChange={(id) => {
                        setData('target_department_id', id);
                        setData('assigned_employee_id', '');
                    }}
                />

                <FormField label="Assigned Person" htmlFor="wr-assignee" optional error={errors.assigned_employee_id}>
                    <select
                        id="wr-assignee"
                        name="assigned_employee_id"
                        value={data.assigned_employee_id}
                        onChange={(event) => setData('assigned_employee_id', event.target.value ? Number(event.target.value) : '')}
                        className="tcds-input"
                    >
                        <option value="">Unassigned / office queue</option>
                        {selectedEmployees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                                {employee.full_name || employee.employee_number} · {employee.position_title}
                            </option>
                        ))}
                    </select>
                </FormField>
            </div>

            {/* 3 mutually exclusive Priority choices -> visible Radio Cards per GOV.UK/modern-web-guidance */}
            <RadioCardGroup
                legend="Priority"
                name="priority"
                value={data.priority}
                onChange={(next) => setData('priority', next)}
                options={PRIORITY_OPTIONS}
                error={errors.priority}
            />

            <FormField label="Target Completion Date" htmlFor="wr-due" required error={errors.due_at}>
                <DateInput
                    id="wr-due"
                    name="due_at"
                    value={data.due_at}
                    onChange={(next) => setData('due_at', next)}
                    presets="deadline"
                    required
                />
            </FormField>

            <FormField
                label="Subject"
                htmlFor="wr-title"
                required
                hint="Write a concise summary of what requires office action."
                error={errors.title}
            >
                <input
                    id="wr-title"
                    name="title"
                    type="text"
                    value={data.title}
                    onChange={(event) => setData('title', event.target.value)}
                    placeholder="e.g., Annual Investment Program amendment endorsement"
                    className="tcds-input"
                    required
                />
            </FormField>

            <FormField label="Instructions / Details" htmlFor="wr-description" optional>
                <textarea
                    id="wr-description"
                    name="description"
                    value={data.description}
                    onChange={(event) => setData('description', event.target.value)}
                    rows={3}
                    placeholder="Provide scope, references, or specific instructions for the receiving office"
                    className="tcds-input min-h-24 resize-y"
                />
            </FormField>

            <details
                open={evidenceHasError || data.evidence.length > 0 ? true : undefined}
                className="group rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)]"
            >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2 text-sm font-semibold text-[var(--ink-primary)] marker:hidden">
                    <span className="inline-flex items-center gap-2">
                        <Paperclip size={15} aria-hidden="true" />
                        <span>Supporting attachment</span>
                        <span className="text-xs font-normal text-[var(--ink-secondary)]">(optional)</span>
                    </span>
                    <span className="text-xs font-semibold text-[var(--brand-ink)] group-open:hidden">Add file</span>
                    <span className="hidden text-xs font-semibold text-[var(--brand-ink)] group-open:inline">Hide</span>
                </summary>
                <div className="border-t border-[var(--border-default)] p-3.5">
                    <EvidenceFields
                        files={data.evidence}
                        onChange={(files) => setData('evidence', files)}
                        errors={errors as Record<string, string | undefined>}
                        disabled={processing}
                        label="Work Request attachment"
                    />
                </div>
            </details>

            {!hideFooter && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)] pt-4">
                    {onCancel ? (
                        <button type="button" onClick={onCancel} className="municipal-secondary-button">
                            Cancel
                        </button>
                    ) : (
                        <Link href="/transactions" className="municipal-secondary-button">
                            Cancel
                        </Link>
                    )}
                    <button
                        type="submit"
                        disabled={processing || departments.length === 0 || requestTypes.length === 0 || actionOptions.length === 0}
                        aria-busy={processing}
                        className="municipal-primary-button"
                    >
                        <Building2 size={16} aria-hidden="true" />
                        <span>{processing ? 'Submitting…' : 'Submit Work Request'}</span>
                        <ArrowRight size={16} aria-hidden="true" />
                    </button>
                </div>
            )}
        </form>
    );
}

export default function Create(props: WorkRequestCreateProps) {
    return (
        <AppLayout title="Create Work Request">
            <div className="civic-page mx-auto max-w-3xl">
                <PageHeader
                    eyebrow="Work Requests · New request"
                    title="Create Work Request"
                    subtitle="Route accountable work to the correct municipal office and responsible staff member."
                    actions={
                        <Link href="/transactions" className="municipal-secondary-button">
                            <ArrowLeft size={16} aria-hidden="true" />
                            <span>Back to Work Requests</span>
                        </Link>
                    }
                />
                <div className="tcds-card p-5 sm:p-6">
                    <WorkRequestCreateForm {...props} />
                </div>
            </div>
        </AppLayout>
    );
}
