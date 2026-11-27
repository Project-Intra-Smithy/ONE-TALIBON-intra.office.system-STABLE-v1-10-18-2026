import { useId, useState } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    promptLabel?: string;
    promptPlaceholder?: string;
    promptRequired?: boolean;
    onCancel: () => void;
    onConfirm: (value?: string) => void;
};

/** Accessible native <dialog> replacement for blocking window.confirm() and window.prompt(). */
export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = false,
    promptLabel,
    promptPlaceholder,
    promptRequired = false,
    onCancel,
    onConfirm,
}: ConfirmDialogProps) {
    const [value, setValue] = useState('');
    const [error, setError] = useState('');
    const inputId = useId();
    const errorId = useId();

    const handleConfirm = () => {
        if (promptLabel && promptRequired && !value.trim()) {
            setError('Please enter a reason before continuing.');
            return;
        }
        const submitted = promptLabel ? value.trim() : undefined;
        setValue('');
        setError('');
        onConfirm(submitted);
    };

    const handleClose = () => {
        setValue('');
        setError('');
        onCancel();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            title={title}
            lightDismiss={false}
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose} autoFocus>
                        {cancelLabel}
                    </Button>
                    <Button variant={destructive ? 'danger' : 'primary'} onClick={handleConfirm}>
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <p className="text-sm leading-6 text-[var(--ink-secondary)]">{message}</p>
            {promptLabel && (
                <div className="mt-4">
                    <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-[var(--ink-primary)]">
                        {promptLabel} {promptRequired && <span className="text-[var(--status-danger-fg)]" aria-hidden="true">*</span>}
                    </label>
                    <input
                        id={inputId}
                        type="text"
                        value={value}
                        onChange={(event) => {
                            setValue(event.target.value);
                            if (error) setError('');
                        }}
                        placeholder={promptPlaceholder}
                        aria-invalid={error ? 'true' : undefined}
                        aria-describedby={error ? errorId : undefined}
                        className="tcds-input"
                    />
                    {error && (
                        <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-[var(--status-danger-fg)]">
                            {error}
                        </p>
                    )}
                </div>
            )}
        </Dialog>
    );
}
