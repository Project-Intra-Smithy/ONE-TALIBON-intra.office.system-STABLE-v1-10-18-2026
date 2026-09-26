import { CircleHelp, Info, Play, UsersRound, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ShowcaseSessionState } from '../showcase/types';
import GuidedTour from './GuidedTour';
import {
    hasCompletedIntroduction,
    hasCompletedPersonaTour,
    hasSeenPersonaOfferThisSession,
    markIntroductionCompleted,
    markPersonaOfferSeenThisSession,
    markPersonaTourCompleted,
} from './onboardingStorage';
import { personaTours, presentationCredits } from './tourCatalog';
import { isPersonaTourKey, ONBOARDING_GUIDE_EVENT, type PersonaTourKey } from './types';
import useDialogFocusTrap from './useDialogFocusTrap';
import WelcomeWizard from './WelcomeWizard';

type Mode = 'idle' | 'first-run' | 'wizard' | 'persona-offer' | 'tour' | 'guide' | 'about' | 'credits';

export default function FirstRunGate({ showcaseSession }: { showcaseSession: ShowcaseSessionState }) {
    const persona = showcaseSession?.active ? showcaseSession.persona : null;
    const personaKey: PersonaTourKey | null = persona && isPersonaTourKey(persona.key) ? persona.key : null;
    const [mode, setMode] = useState<Mode>('idle');
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!persona || !personaKey) {
            setMode('idle');
            return;
        }

        if (!hasCompletedIntroduction()) {
            setMode('first-run');
            return;
        }

        if (!hasCompletedPersonaTour(personaKey) && !hasSeenPersonaOfferThisSession(personaKey)) {
            markPersonaOfferSeenThisSession(personaKey);
            setMode('persona-offer');
            return;
        }

        setMode('idle');
    }, [persona?.key, personaKey]);

    useEffect(() => {
        const openGuide = () => {
            if (personaKey) setMode('guide');
        };
        window.addEventListener(ONBOARDING_GUIDE_EVENT, openGuide);
        return () => window.removeEventListener(ONBOARDING_GUIDE_EVENT, openGuide);
    }, [personaKey]);

    const enterWorkspace = useCallback(() => {
        if (personaKey) markPersonaOfferSeenThisSession(personaKey);
        markIntroductionCompleted();
        setMode('idle');
    }, [personaKey]);

    const closeSimpleModal = useCallback(() => {
        if (mode === 'first-run') {
            enterWorkspace();
            return;
        }
        setMode('idle');
    }, [enterWorkspace, mode]);

    const simpleModal = mode === 'first-run' || mode === 'persona-offer' || mode === 'guide' || mode === 'about' || mode === 'credits';
    useDialogFocusTrap(dialogRef, simpleModal, closeSimpleModal);

    if (!persona || !personaKey) return null;

    if (mode === 'wizard') {
        return <WelcomeWizard
            persona={persona}
            onSkip={enterWorkspace}
            onStartTour={() => {
                markIntroductionCompleted();
                setMode('tour');
            }}
            onExplore={enterWorkspace}
        />;
    }

    if (mode === 'tour') {
        return <GuidedTour
            steps={personaTours[personaKey]}
            onExit={() => {
                markPersonaOfferSeenThisSession(personaKey);
                setMode('idle');
            }}
            onFinish={() => {
                markIntroductionCompleted();
                markPersonaTourCompleted(personaKey);
                setMode('idle');
            }}
        />;
    }

    if (!simpleModal) return null;

    const title = mode === 'first-run'
        ? 'Is this your first time exploring ONE TALIBON?'
        : mode === 'persona-offer'
            ? 'Explore this workspace?'
            : mode === 'guide'
                ? 'ONE TALIBON Guide'
                : mode === 'about'
                    ? 'About this prototype'
                    : 'Development credits';

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#071b13]/70 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="ow1-gate-title"
                aria-describedby="ow1-gate-description"
                data-onboarding={mode}
                className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-[#d6e1da] bg-[#f7f5ed] p-5 text-[#163027] shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-6 dark:border-[#30473a] dark:bg-[#0f1a15] dark:text-[#edf5f0]"
                style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#12613f] dark:text-[#8fc9a7]">ONE TALIBON</p>
                        <h2 id="ow1-gate-title" className="mt-1 text-2xl font-extrabold tracking-[-0.03em]">{title}</h2>
                    </div>
                    {(mode === 'guide' || mode === 'about' || mode === 'credits') && (
                        <button type="button" onClick={() => setMode('idle')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#64736c] hover:bg-[#e9f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] dark:text-[#adbbb3] dark:hover:bg-[#1b2e24]" aria-label="Close guide">
                            <X size={18} aria-hidden="true" />
                        </button>
                    )}
                </div>

                {mode === 'first-run' && (
                    <>
                        <p id="ow1-gate-description" className="mt-3 text-sm leading-6 text-[#55665e] dark:text-[#c3d0c8]">
                            We can give you a short introduction and show you around this municipal workspace.
                        </p>
                        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button type="button" onClick={enterWorkspace} className="min-h-11 rounded-lg border border-[#b9c9bf] px-4 py-2 text-sm font-semibold text-[#55665e] hover:bg-[#e9f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] dark:border-[#40584a] dark:text-[#c3d0c8] dark:hover:bg-[#1b2e24]">No, enter workspace</button>
                            <button type="button" data-autofocus onClick={() => setMode('wizard')} className="min-h-11 rounded-lg bg-[#164f36] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f402b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] focus-visible:ring-offset-2 dark:bg-[#2a7c55]">Yes, show me around</button>
                        </div>
                    </>
                )}

                {mode === 'persona-offer' && (
                    <>
                        <p id="ow1-gate-description" className="mt-3 text-sm leading-6 text-[#55665e] dark:text-[#c3d0c8]">
                            You’re now viewing ONE TALIBON as <strong>{persona.label}</strong> in {persona.office}. Would you like a quick tour of the tools most relevant to this workspace?
                        </p>
                        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => setMode('idle')} className="min-h-11 rounded-lg border border-[#b9c9bf] px-4 py-2 text-sm font-semibold text-[#55665e] hover:bg-[#e9f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] dark:border-[#40584a] dark:text-[#c3d0c8] dark:hover:bg-[#1b2e24]">Not now</button>
                            <button type="button" data-autofocus onClick={() => setMode('tour')} className="min-h-11 rounded-lg bg-[#164f36] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f402b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] focus-visible:ring-offset-2 dark:bg-[#2a7c55]">Take the quick tour</button>
                        </div>
                    </>
                )}

                {mode === 'guide' && (
                    <div id="ow1-gate-description" className="mt-4 space-y-2">
                        <button type="button" data-autofocus onClick={() => setMode('tour')} className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-[#d6e1da] bg-white/65 px-4 py-3 text-left hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] dark:border-[#30473a] dark:bg-[#16261d] dark:hover:bg-[#1b2e24]"><Play size={18} className="text-[#12613f] dark:text-[#8fc9a7]" aria-hidden="true" /><span><strong className="block text-sm">Replay this workspace tour</strong><span className="mt-0.5 block text-xs text-[#64736c] dark:text-[#adbbb3]">{persona.label} · {persona.office}</span></span></button>
                        <button type="button" onClick={() => setMode('about')} className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-[#d6e1da] bg-white/65 px-4 py-3 text-left hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] dark:border-[#30473a] dark:bg-[#16261d] dark:hover:bg-[#1b2e24]"><Info size={18} className="text-[#12613f] dark:text-[#8fc9a7]" aria-hidden="true" /><strong className="text-sm">About this prototype</strong></button>
                        <button type="button" onClick={() => setMode('credits')} className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-[#d6e1da] bg-white/65 px-4 py-3 text-left hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] dark:border-[#30473a] dark:bg-[#16261d] dark:hover:bg-[#1b2e24]"><UsersRound size={18} className="text-[#12613f] dark:text-[#8fc9a7]" aria-hidden="true" /><strong className="text-sm">Development credits</strong></button>
                    </div>
                )}

                {mode === 'about' && (
                    <div id="ow1-gate-description" className="mt-4 space-y-3 text-sm leading-6 text-[#55665e] dark:text-[#c3d0c8]">
                        <p>ONE TALIBON is currently presented as an <strong>evaluation prototype</strong> for the Municipality of Talibon.</p>
                        <p>The user interface is in its <strong>initial design and validation phase</strong>. Layouts, navigation, terminology, visual hierarchy, interactions, and individual screens may be refined based on stakeholder feedback, usability review, operational requirements, and subsequent implementation decisions.</p>
                        <p>Sample and demonstration content is provided for evaluation and does not represent final official municipal reporting or production operational data.</p>
                        <button type="button" data-autofocus onClick={() => setMode('guide')} className="mt-2 min-h-11 rounded-lg border border-[#b9c9bf] px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] dark:border-[#40584a]">Back to guide</button>
                    </div>
                )}

                {mode === 'credits' && (
                    <div id="ow1-gate-description" className="mt-4 space-y-4">
                        <div><div className="text-lg font-extrabold">{presentationCredits.project}</div><div className="text-sm text-[#64736c] dark:text-[#adbbb3]">{presentationCredits.subtitle} · {presentationCredits.municipality}</div></div>
                        <div className="rounded-xl border border-[#d6e1da] p-4 dark:border-[#30473a]"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#12613f] dark:text-[#8fc9a7]">Technical authority & engineering direction</p><div className="mt-2 font-bold">{presentationCredits.technicalAuthority.name}</div><div className="text-sm text-[#64736c] dark:text-[#adbbb3]">{presentationCredits.technicalAuthority.role}</div>{presentationCredits.technicalAuthority.specialization && <div className="text-sm text-[#64736c] dark:text-[#adbbb3]">{presentationCredits.technicalAuthority.specialization}</div>}<div className="text-xs font-semibold text-[#64736c] dark:text-[#adbbb3]">{presentationCredits.technicalAuthority.organization}</div></div>
                        <div><p className="text-xs font-bold uppercase tracking-wide text-[#64736c] dark:text-[#adbbb3]">{presentationCredits.collaboration}</p><div className="mt-2 space-y-1">{presentationCredits.contributors.map((credit) => <div key={credit.name} className="text-sm"><strong>{credit.name}</strong> <span className="text-[#64736c] dark:text-[#adbbb3]">· {credit.role}, {credit.organization}</span></div>)}</div></div>
                        <button type="button" data-autofocus onClick={() => setMode('guide')} className="min-h-11 rounded-lg border border-[#b9c9bf] px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] dark:border-[#40584a]">Back to guide</button>
                    </div>
                )}
            </div>
        </div>
    );
}
