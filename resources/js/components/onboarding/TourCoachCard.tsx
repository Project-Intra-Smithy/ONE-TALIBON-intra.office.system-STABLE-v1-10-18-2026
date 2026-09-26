import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { forwardRef, type CSSProperties } from 'react';
import type { TourStep } from './types';

type Props = {
    step: TourStep;
    index: number;
    count: number;
    targetAvailable: boolean;
    mobile: boolean;
    placementStyle?: CSSProperties;
    onBack: () => void;
    onNext: () => void;
    onExit: () => void;
};

const TourCoachCard = forwardRef<HTMLDivElement, Props>(function TourCoachCard({
    step,
    index,
    count,
    targetAvailable,
    mobile,
    placementStyle,
    onBack,
    onNext,
    onExit,
}, ref) {
    const finalStep = index === count - 1;

    return (
        <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guided-tour-title"
            aria-describedby="guided-tour-description"
            className={mobile
                ? 'fixed inset-x-0 bottom-0 z-[100] max-h-[58dvh] overflow-y-auto rounded-t-2xl border border-[#d6e1da] bg-[#f7f5ed] px-4 pt-4 text-[#163027] shadow-2xl dark:border-[#30473a] dark:bg-[#0f1a15] dark:text-[#edf5f0]'
                : 'fixed z-[100] w-[min(360px,calc(100vw-32px))] rounded-2xl border border-[#d6e1da] bg-[#f7f5ed] p-5 text-[#163027] shadow-2xl dark:border-[#30473a] dark:bg-[#0f1a15] dark:text-[#edf5f0]'}
            style={mobile ? { paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' } : placementStyle}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#12613f] dark:text-[#8fc9a7]">Guided workspace tour</p>
                    <div className="mt-1 text-xs font-semibold text-[#64736c] dark:text-[#adbbb3]" aria-live="polite">Step {index + 1} of {count}</div>
                </div>
                <button type="button" onClick={onExit} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#64736c] hover:bg-[#e9f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] dark:text-[#adbbb3] dark:hover:bg-[#1b2e24]" aria-label="Exit tour">
                    <X size={18} aria-hidden="true" />
                </button>
            </div>

            <h2 id="guided-tour-title" className="mt-3 text-xl font-extrabold tracking-[-0.02em]">{step.title}</h2>
            <p id="guided-tour-description" className="mt-2 text-sm leading-6 text-[#55665e] dark:text-[#c3d0c8]">{step.body}</p>
            {!targetAvailable && (
                <p className="mt-3 rounded-lg border border-[#d6e1da] bg-white/60 px-3 py-2 text-xs leading-5 text-[#64736c] dark:border-[#30473a] dark:bg-[#16261d] dark:text-[#adbbb3]">
                    This item is not visible in the current layout. You can continue the tour without opening or changing navigation.
                </p>
            )}

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#d6e1da] pt-4 dark:border-[#30473a]">
                <button type="button" onClick={onBack} disabled={index === 0} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#55665e] hover:bg-[#e9f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] disabled:cursor-not-allowed disabled:opacity-35 dark:text-[#c3d0c8] dark:hover:bg-[#1b2e24]">
                    <ArrowLeft size={16} aria-hidden="true" /> Back
                </button>
                <span className="sr-only" aria-live="polite">Tour progress: {index + 1} of {count}</span>
                <button type="button" data-autofocus onClick={onNext} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#164f36] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f402b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] focus-visible:ring-offset-2 dark:bg-[#2a7c55] dark:hover:bg-[#338e63]">
                    {finalStep ? 'Finish tour' : 'Next'} {!finalStep && <ArrowRight size={16} aria-hidden="true" />}
                </button>
            </div>
        </div>
    );
});

export default TourCoachCard;
