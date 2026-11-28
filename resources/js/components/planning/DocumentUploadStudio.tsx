import { useId, type FormEvent } from 'react';
import { Upload } from 'lucide-react';
import { Button, FormField } from '../ui';

type Option = { value: string; label: string };
type Props = {
    error?: string; title: string; category: string; visibility: string; controlRef?: string;
    onTitleChange: (value: string) => void; onCategoryChange: (value: string) => void;
    onVisibilityChange: (value: string) => void; onControlRefChange?: (value: string) => void;
    onFileChange: (file: File | null) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancel: () => void; categories: Option[]; visibilities: Option[];
    accept: string; fileLabel: string; selectedFileLabel?: string; busy?: boolean; submitLabel?: string;
};

/** File persistence, visibility authority and synthetic records stay in their runtime adapters. */
export default function DocumentUploadStudio(props: Props) {
    const id = useId();
    return <form onSubmit={props.onSubmit} className="mt-3 space-y-3 rounded-xl border border-[var(--brand-soft-border)] bg-[var(--surface-recessed)] p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]"><Upload size={14} aria-hidden="true" />Attach supporting file</div>
        {props.error && <p role="alert" className="rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-3 text-sm text-[var(--status-danger-fg)]">{props.error}</p>}
        <fieldset disabled={props.busy} className="grid min-w-0 gap-3 sm:grid-cols-2">
            <FormField label={props.fileLabel} htmlFor={`${id}-file`} required className="sm:col-span-2">
                <input id={`${id}-file`} type="file" required accept={props.accept} onChange={event => props.onFileChange(event.target.files?.[0] ?? null)} className="tcds-input min-h-11 py-2 text-xs" />
                {props.selectedFileLabel && <p className="mt-1 break-words text-xs text-[var(--brand-ink)]">Selected: {props.selectedFileLabel}</p>}
            </FormField>
            <FormField label="Document title" htmlFor={`${id}-title`} required className="sm:col-span-2">
                <input id={`${id}-title`} required maxLength={255} value={props.title} onChange={event => props.onTitleChange(event.target.value)} placeholder="e.g., Technical Narrative / Program of Works" className="tcds-input min-h-11" />
            </FormField>
            <FormField label="Control / Resolution Ref." htmlFor={`${id}-reference`} optional>
                <input id={`${id}-reference`} disabled={!props.onControlRefChange} value={props.controlRef ?? ''} onChange={event => props.onControlRefChange?.(event.target.value)} className="tcds-input min-h-11 font-mono" />
                {!props.onControlRefChange && <p className="mt-1 text-xs text-[var(--ink-secondary)]">Separate control references are unavailable in the current attachment contract.</p>}
            </FormField>
            <FormField label="Document category" htmlFor={`${id}-category`} required>
                <select id={`${id}-category`} value={props.category} onChange={event => props.onCategoryChange(event.target.value)} className="tcds-input min-h-11">{props.categories.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            </FormField>
            <FormField label="Access visibility tier" htmlFor={`${id}-visibility`} required className="sm:col-span-2">
                <select id={`${id}-visibility`} value={props.visibility} onChange={event => props.onVisibilityChange(event.target.value)} className="tcds-input min-h-11">{props.visibilities.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            </FormField>
        </fieldset>
        <div className="flex flex-wrap justify-end gap-2 pt-1"><Button type="button" variant="secondary" size="sm" onClick={props.onCancel} disabled={props.busy}>Cancel</Button><Button type="submit" size="sm" loading={props.busy}>{props.submitLabel ?? 'Save attachment'}</Button></div>
    </form>;
}
