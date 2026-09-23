import { router } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    Building2,
    Landmark,
    Settings2,
    UserRound,
    UsersRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import PersonaCard from './PersonaCard';
import type { ShowcasePersona } from './types';

type Props = {
    open: boolean;
    personas: ShowcasePersona[];
    onClose: () => void;
};

const focusableSelector = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function WorkspaceDialog({ open, personas, onClose }: Props) {
    const [step, setStep] = useState<'roles' | 'departments'>('roles');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const byKey = useMemo(
        () => new Map(personas.map((persona) => [persona.key, persona])),
        [personas],
    );

    useEffect(() => {
        if (!open) return;

        setStep('roles');
        setError(null);
        window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !processing) {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== 'Tab') return;

            const focusable = Array.from(
                dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
            ).filter((element) => element.offsetParent !== null);

            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose, processing]);

    if (!open) return null;

    const enter = (persona: ShowcasePersona | undefined) => {
        if (!persona || processing) return;

        setError(null);
        router.post(
            '/showcase/session',
            { persona: persona.key },
            {
                preserveScroll: false,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onError: (errors) => {
                    const message = errors.persona;
                    setError(typeof message === 'string' ? message : 'Workspace access could not be completed.');
                },
            },
        );
    };

    const executive = byKey.get('executive');
    const employee = byKey.get('employee');
    const hr = byKey.get('hr');
    const legislative = byKey.get('legislative');
    const systemAdmin = byKey.get('system_admin');
    const engineering = byKey.get('engineering_head');
    const budget = byKey.get('budget_head');

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#071b13]/65 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !processing) onClose();
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="workspace-dialog-title"
                aria-describedby="workspace-dialog-description"
                className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-[#d6e1da] bg-[#f7f5ed] shadow-2xl sm:max-w-3xl sm:rounded-2xl dark:border-[#30473a] dark:bg-[#0f1a15]"
            >
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#d6e1da] bg-[#f7f5ed]/95 px-5 py-4 backdrop-blur sm:px-6 dark:border-[#30473a] dark:bg-[#0f1a15]/95">
                    <div className="min-w-0">
                        {step === 'departments' && (
                            <button
                                type="button"
                                onClick={() => setStep('roles')}
                                disabled={processing}
                                className="mb-2 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-[#64736c] transition-colors hover:bg-[#e9f2ec] hover:text-[#163027] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] disabled:opacity-60 dark:text-[#adbbb3] dark:hover:bg-[#1b2e24] dark:hover:text-[#edf5f0]"
                            >
                                <ArrowLeft size={16} aria-hidden="true" /> Back
                            </button>
                        )}
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#12613f] dark:text-[#8fc9a7]">ONE TALIBON</p>
                        <h2 id="workspace-dialog-title" className="mt-1 text-xl font-extrabold tracking-[-0.02em] text-[#163027] dark:text-[#edf5f0]">
                            {step === 'roles' ? 'Choose your workspace' : 'Choose office context'}
                        </h2>
                        <p id="workspace-dialog-description" className="mt-1 text-sm leading-5 text-[#64736c] dark:text-[#adbbb3]">
                            {step === 'roles'
                                ? 'Select the municipal role you want to enter.'
                                : 'Select the department head office to open.'}
                        </p>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        aria-label="Close workspace selector"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#64736c] transition-colors hover:bg-[#e9f2ec] hover:text-[#163027] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] disabled:opacity-60 dark:text-[#adbbb3] dark:hover:bg-[#1b2e24] dark:hover:text-[#edf5f0]"
                    >
                        <X size={19} aria-hidden="true" />
                    </button>
                </div>

                <div className="space-y-3 p-5 sm:p-6" aria-busy={processing}>
                    {error && (
                        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                            {error}
                        </div>
                    )}

                    {step === 'roles' ? (
                        <>
                            <PersonaCard
                                label="Municipal Executive"
                                description="Municipality-wide oversight and decisions"
                                context={executive?.office}
                                icon={Landmark}
                                onClick={() => enter(executive)}
                                disabled={processing || !executive}
                            />
                            <PersonaCard
                                label="Department Head"
                                description="Department work, programs and office coordination"
                                context="Choose Engineering or Budget"
                                icon={Building2}
                                onClick={() => setStep('departments')}
                                disabled={processing || (!engineering && !budget)}
                            />
                            <PersonaCard
                                label="Employee"
                                description="Assigned work, records and daily office coordination"
                                context={employee?.office}
                                icon={UserRound}
                                onClick={() => enter(employee)}
                                disabled={processing || !employee}
                            />
                            <PersonaCard
                                label="Human Resources"
                                description="Workforce coordination and personnel operations"
                                context={hr?.office}
                                icon={UsersRound}
                                onClick={() => enter(hr)}
                                disabled={processing || !hr}
                            />
                            <PersonaCard
                                label="Legislative Office"
                                description="Legislative records, references and office work"
                                context={legislative?.office}
                                icon={BriefcaseBusiness}
                                onClick={() => enter(legislative)}
                                disabled={processing || !legislative}
                            />
                            <PersonaCard
                                label="System Administration"
                                description="Workspace administration and municipal systems"
                                context={systemAdmin?.office}
                                icon={Settings2}
                                onClick={() => enter(systemAdmin)}
                                disabled={processing || !systemAdmin}
                            />
                        </>
                    ) : (
                        <>
                            {engineering && (
                                <PersonaCard
                                    label={engineering.office}
                                    description={engineering.position}
                                    icon={Building2}
                                    onClick={() => enter(engineering)}
                                    disabled={processing}
                                />
                            )}
                            {budget && (
                                <PersonaCard
                                    label={budget.office}
                                    description={budget.position}
                                    icon={Building2}
                                    onClick={() => enter(budget)}
                                    disabled={processing}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
