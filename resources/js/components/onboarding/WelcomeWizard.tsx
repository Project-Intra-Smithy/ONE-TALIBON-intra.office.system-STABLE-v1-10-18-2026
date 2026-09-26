import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Files, Network, Route, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { ShowcasePersona } from '../showcase/types';
import { presentationCredits } from './tourCatalog';
import useDialogFocusTrap from './useDialogFocusTrap';

type Props = {
    persona: ShowcasePersona;
    onSkip: () => void;
    onStartTour: () => void;
    onExplore: () => void;
};

const screens = [
    { eyebrow: 'MUNICIPAL DIGITAL WORKSPACE', title: 'Welcome to ONE TALIBON' },
    { eyebrow: 'CONNECTED MUNICIPAL WORK', title: 'One municipality. Connected work.' },
    { eyebrow: 'PROTOTYPE STATUS', title: 'Prototype & Interface Notice' },
    { eyebrow: 'DEVELOPMENT', title: 'Development credits' },
    { eyebrow: 'YOUR WORKSPACE', title: 'Ready to explore?' },
] as const;

export default function WelcomeWizard({ persona, onSkip, onStartTour, onExplore }: Props) {
    const [step, setStep] = useState(0);
    const dialogRef = useRef<HTMLDivElement>(null);
    const escape = useCallback(() => onSkip(), [onSkip]);
    useDialogFocusTrap(dialogRef, true, escape);

    const last = step === screens.length - 1;
    const current = screens[step];

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#071b13]/70 backdrop-blur-[2px] sm:items-center sm:p-5">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="ow1-wizard-title"
                aria-describedby="ow1-wizard-description"
                data-onboarding="welcome-wizard"
                className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#f7f5ed] text-[#163027] shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl sm:rounded-2xl sm:border sm:border-[#d6e1da] dark:border-[#30473a] dark:bg-[#0f1a15] dark:text-[#edf5f0]"
            >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#d6e1da] px-5 py-4 sm:px-6 dark:border-[#30473a]">
                    <div className="min-w-0">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#12613f] dark:text-[#8fc9a7]">{current.eyebrow}</p>
                        <h2 id="ow1-wizard-title" className="mt-1 text-2xl font-extrabold tracking-[-0.03em]">{current.title}</h2>
                        <p className="mt-1 text-xs font-semibold text-[#64736c] dark:text-[#adbbb3]" aria-live="polite">Introduction {step + 1} of {screens.length}</p>
                    </div>
                    <button type="button" onClick={onSkip} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#64736c] hover:bg-[#e9f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] dark:text-[#adbbb3] dark:hover:bg-[#1b2e24]" aria-label="Skip introduction">
                        <X size={19} aria-hidden="true" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6" data-onboarding-step={step + 1}>
                    {step === 0 && (
                        <div id="ow1-wizard-description" className="space-y-5">
                            <p className="text-sm leading-6 text-[#55665e] dark:text-[#c3d0c8]">
                                ONE TALIBON is the Municipality of Talibon’s prototype intra-office workspace for coordinating official work, records, correspondence, memoranda, schedules, projects, meetings, and internal communication across municipal offices.
                            </p>
                            <section className="rounded-xl border border-[#c8d9ce] bg-white/70 p-4 dark:border-[#30473a] dark:bg-[#16261d]" aria-label="Current workspace">
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#12613f] dark:text-[#8fc9a7]">Current workspace</p>
                                <div className="mt-3 flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e6f0e9] text-[#164f36] dark:bg-[#20382b] dark:text-[#9bd0af]"><Building2 size={19} aria-hidden="true" /></div>
                                    <div>
                                        <div className="font-bold">{persona.label}</div>
                                        <div className="mt-0.5 text-sm text-[#55665e] dark:text-[#c3d0c8]">{persona.office}</div>
                                        <div className="mt-0.5 text-xs font-semibold text-[#64736c] dark:text-[#adbbb3]">{persona.position}</div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {step === 1 && (
                        <div id="ow1-wizard-description">
                            <p className="text-sm leading-6 text-[#55665e] dark:text-[#c3d0c8]">
                                This prototype demonstrates how municipal offices can work inside one shared environment while preserving office responsibility, role-based access, routing history, and municipal context.
                            </p>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {[
                                    [Route, 'Route Work', 'Move requests and official actions between responsible offices.'],
                                    [Files, 'Keep Records Visible', 'Reference correspondence, records, memoranda, and supporting information.'],
                                    [Network, 'Coordinate', 'Keep schedules, meetings, projects, and office activity visible.'],
                                    [CheckCircle2, 'Follow Through', 'See who owns work, what needs attention, and how work progresses.'],
                                ].map(([Icon, title, body]) => {
                                    const ConceptIcon = Icon as typeof Route;
                                    return <article key={String(title)} className="rounded-xl border border-[#d6e1da] bg-white/65 p-4 dark:border-[#30473a] dark:bg-[#16261d]"><ConceptIcon size={18} className="text-[#12613f] dark:text-[#8fc9a7]" aria-hidden="true" /><h3 className="mt-2 text-sm font-bold">{String(title)}</h3><p className="mt-1 text-sm leading-5 text-[#64736c] dark:text-[#adbbb3]">{String(body)}</p></article>;
                                })}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div id="ow1-wizard-description" className="space-y-4">
                            <div className="rounded-xl border border-[#d3ad5b]/60 bg-[#fff9e8] p-4 dark:border-[#7f6631] dark:bg-[#292313]">
                                <p className="text-sm leading-6 text-[#554b32] dark:text-[#e6d9b2]">
                                    ONE TALIBON is currently presented as an <strong>evaluation prototype</strong> for the Municipality of Talibon.
                                </p>
                            </div>
                            <p className="text-sm leading-6 text-[#55665e] dark:text-[#c3d0c8]">
                                The user interface is in its <strong>initial design and validation phase</strong>. Layouts, navigation, terminology, visual hierarchy, interactions, and individual screens may be refined or changed based on stakeholder feedback, usability review, operational requirements, and subsequent implementation decisions.
                            </p>
                            <p className="text-sm leading-6 text-[#55665e] dark:text-[#c3d0c8]">
                                Sample and demonstration content is provided for evaluation and does not represent final official municipal reporting or production operational data.
                            </p>
                            <p className="text-sm leading-6 text-[#55665e] dark:text-[#c3d0c8]">
                                This prototype is intended to demonstrate the proposed municipal workspace, workflows, information structure, and overall user experience.
                            </p>
                        </div>
                    )}

                    {step === 3 && (
                        <div id="ow1-wizard-description" className="space-y-4">
                            <div>
                                <div className="text-xl font-extrabold">{presentationCredits.project}</div>
                                <div className="mt-1 text-sm text-[#64736c] dark:text-[#adbbb3]">{presentationCredits.subtitle} · {presentationCredits.municipality}</div>
                            </div>
                            <section className="rounded-xl border border-[#d6e1da] bg-white/65 p-4 dark:border-[#30473a] dark:bg-[#16261d]">
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#12613f] dark:text-[#8fc9a7]">Technical authority & engineering direction</p>
                                <div className="mt-2 font-bold">{presentationCredits.technicalAuthority.name}</div>
                                <div className="mt-0.5 text-sm text-[#55665e] dark:text-[#c3d0c8]">{presentationCredits.technicalAuthority.role}</div>
                                {presentationCredits.technicalAuthority.specialization && <div className="mt-0.5 text-sm text-[#64736c] dark:text-[#adbbb3]">{presentationCredits.technicalAuthority.specialization}</div>}
                                <div className="mt-0.5 text-xs font-semibold text-[#64736c] dark:text-[#adbbb3]">{presentationCredits.technicalAuthority.organization}</div>
                            </section>
                            <section>
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#64736c] dark:text-[#adbbb3]">Development collaboration</p>
                                <p className="mt-1 text-sm font-bold">{presentationCredits.collaboration}</p>
                                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                    {presentationCredits.contributors.map((credit) => <div key={credit.name} className="rounded-lg border border-[#d6e1da] px-3 py-2 dark:border-[#30473a]"><div className="text-sm font-bold">{credit.name}</div><div className="text-xs text-[#64736c] dark:text-[#adbbb3]">{credit.role} · {credit.organization}</div></div>)}
                                </div>
                            </section>
                            <p className="text-xs leading-5 text-[#64736c] dark:text-[#adbbb3]">{presentationCredits.footer}</p>
                        </div>
                    )}

                    {step === 4 && (
                        <div id="ow1-wizard-description" className="flex min-h-52 flex-col justify-center">
                            <p className="max-w-xl text-base leading-7 text-[#55665e] dark:text-[#c3d0c8]">
                                Take a short guided tour of this workspace, or continue directly to the system.
                            </p>
                            <div className="mt-5 rounded-xl border border-[#d6e1da] bg-white/65 p-4 dark:border-[#30473a] dark:bg-[#16261d]">
                                <div className="text-sm font-bold">{persona.label}</div>
                                <div className="mt-1 text-sm text-[#64736c] dark:text-[#adbbb3]">{persona.office} · {persona.position}</div>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="shrink-0 border-t border-[#d6e1da] bg-[#f7f5ed]/95 px-5 py-3 backdrop-blur sm:px-6 dark:border-[#30473a] dark:bg-[#0f1a15]/95" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                    {last ? (
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button type="button" onClick={onExplore} className="min-h-11 rounded-lg border border-[#b9c9bf] px-4 py-2 text-sm font-semibold text-[#55665e] hover:bg-[#e9f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] dark:border-[#40584a] dark:text-[#c3d0c8] dark:hover:bg-[#1b2e24]">Explore on my own</button>
                            <button type="button" data-autofocus onClick={onStartTour} className="min-h-11 rounded-lg bg-[#164f36] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f402b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] focus-visible:ring-offset-2 dark:bg-[#2a7c55]">Start guided tour</button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-3">
                            <button type="button" onClick={() => step === 0 ? onSkip() : setStep((currentStep) => currentStep - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#55665e] hover:bg-[#e9f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] dark:text-[#c3d0c8] dark:hover:bg-[#1b2e24]">
                                {step === 0 ? 'Skip introduction' : <><ArrowLeft size={16} aria-hidden="true" /> Back</>}
                            </button>
                            <button type="button" data-autofocus onClick={() => setStep((currentStep) => Math.min(screens.length - 1, currentStep + 1))} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#164f36] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f402b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] focus-visible:ring-offset-2 dark:bg-[#2a7c55]">
                                Continue <ArrowRight size={16} aria-hidden="true" />
                            </button>
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
}
