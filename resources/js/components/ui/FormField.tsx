import { AlertCircle } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';

type FormFieldProps = {
    label: string;
    htmlFor: string;
    required?: boolean;
    optional?: boolean;
    hint?: string;
    error?: string;
    children: ReactNode;
    className?: string;
};

/** Guaranteed accessible form field wrapper with Gestalt spacing, explicit label, hint, and error linkage. */
export function FormField({
    label,
    htmlFor,
    required = false,
    optional = false,
    hint,
    error,
    children,
    className = '',
}: FormFieldProps) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label htmlFor={htmlFor} className="text-sm font-semibold text-[var(--ink-primary)]">
                {label}
                {required && <span className="ml-1 text-[var(--status-danger-fg)]" aria-hidden="true">*</span>}
                {optional && !required && <span className="ml-1.5 text-xs font-normal text-[var(--ink-secondary)]">(optional)</span>}
            </label>
            {hint && (
                <p id={`${htmlFor}-hint`} className="text-xs leading-5 text-[var(--ink-secondary)]">
                    {hint}
                </p>
            )}
            {children}
            {error && (
                <p id={`${htmlFor}-error`} role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--status-danger-fg)]">
                    <AlertCircle size={14} aria-hidden="true" className="shrink-0" />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
}

export type RadioCardOption = {
    value: string;
    label: string;
    description?: string;
};

/** GOV.UK / modern-web-guidance pattern: visible radio cards for 2-5 mutually exclusive choices. */
export function RadioCardGroup({
    legend,
    name,
    value,
    onChange,
    options,
    error,
    disabled = false,
}: {
    legend: string;
    name: string;
    value: string;
    onChange: (next: string) => void;
    options: RadioCardOption[];
    error?: string;
    disabled?: boolean;
}) {
    const groupId = useId();
    return (
        <fieldset disabled={disabled} className="m-0 border-0 p-0" aria-describedby={error ? `${groupId}-error` : undefined}>
            <legend className="mb-2 text-sm font-semibold text-[var(--ink-primary)]">{legend}</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {options.map((opt) => {
                    const selected = value === opt.value;
                    const optId = `${groupId}-${opt.value}`;
                    return (
                        <label
                            key={opt.value}
                            htmlFor={optId}
                            className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                                selected
                                    ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--ink-primary)]'
                                    : 'border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]'
                            }`}
                        >
                            <input
                                id={optId}
                                type="radio"
                                name={name}
                                value={opt.value}
                                checked={selected}
                                onChange={() => onChange(opt.value)}
                                className="h-4 w-4 shrink-0"
                            />
                            <span className="min-w-0">
                                <span className="block leading-tight">{opt.label}</span>
                                {opt.description && (
                                    <span className="mt-0.5 block text-xs font-normal text-[var(--ink-secondary)]">
                                        {opt.description}
                                    </span>
                                )}
                            </span>
                        </label>
                    );
                })}
            </div>
            {error && (
                <p id={`${groupId}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-[var(--status-danger-fg)]">
                    {error}
                </p>
            )}
        </fieldset>
    );
}

/** GOV.UK-style Error Summary that moves focus to itself on failed submission. */
export function ErrorSummary({ errors, title = 'Please review the highlighted fields' }: { errors: Record<string, string | undefined>; title?: string }) {
    const entries = Object.entries(errors).filter(([, msg]) => Boolean(msg)) as Array<[string, string]>;
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (entries.length > 0) ref.current?.focus();
    }, [entries.length]);

    if (entries.length === 0) return null;

    return (
        <div
            ref={ref}
            tabIndex={-1}
            role="alert"
            aria-labelledby="tcds-error-summary-heading"
            className="rounded-xl border-2 border-[var(--status-danger-bar)] bg-[var(--status-danger-bg)] p-4 text-[var(--status-danger-fg)]"
        >
            <h2 id="tcds-error-summary-heading" className="flex items-center gap-2 text-sm font-bold">
                <AlertCircle size={17} aria-hidden="true" />
                {title}
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {entries.map(([field, msg]) => (
                    <li key={field}>
                        <a href={`#${field}`} className="underline hover:no-underline">
                            {msg}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
