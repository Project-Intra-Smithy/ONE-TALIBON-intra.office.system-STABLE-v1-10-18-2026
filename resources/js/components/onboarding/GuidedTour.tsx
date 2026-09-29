import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TourCoachCard from './TourCoachCard';
import TourSpotlight, { type SpotlightRect } from './TourSpotlight';
import type { TourStep } from './types';
import useDialogFocusTrap from './useDialogFocusTrap';

type Props = {
    steps: TourStep[];
    onExit: () => void;
    onFinish: () => void;
};

function tourCandidates(target: string): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('[data-tour]'))
        .filter((element) => element.dataset.tour === target);
}

function tourTarget(target: string, visibleOnly = true): HTMLElement | null {
    const candidates = tourCandidates(target);
    return (visibleOnly
        ? candidates.find((element) => element.offsetParent !== null)
        : candidates[0]) ?? null;
}

function hiddenNavigationTarget(target: string): HTMLElement | null {
    const candidates = tourCandidates(target);
    return candidates.find((element) => element.closest('section')?.offsetParent !== null)
        ?? candidates[0]
        ?? null;
}

function visibleNavigationToggle(): HTMLButtonElement | null {
    return Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-label="Open navigation"]'))
        .find((button) => button.offsetParent !== null) ?? null;
}

function settleLayout(): Promise<void> {
    return new Promise((resolve) => {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => resolve());
        });
    });
}

async function revealTourTarget(target: string): Promise<HTMLElement | null> {
    const visible = tourTarget(target);
    if (visible) return visible;

    if (target.startsWith('nav:')) {
        const navigationToggle = visibleNavigationToggle();
        if (navigationToggle) {
            navigationToggle.click();
            await settleLayout();
            const mobileTarget = tourTarget(target);
            if (mobileTarget) return mobileTarget;
        }
    }

    const hidden = target.startsWith('nav:')
        ? hiddenNavigationTarget(target)
        : tourTarget(target, false);
    if (!hidden) return null;

    const owningSection = hidden.closest('section');
    const collapsedToggle = owningSection?.querySelector<HTMLButtonElement>(
        'button.portal-sidebar-group-toggle[aria-expanded="false"]',
    );

    if (!collapsedToggle) return null;

    collapsedToggle.click();
    await settleLayout();

    return tourTarget(target);
}

export default function GuidedTour({ steps, onExit, onFinish }: Props) {
    const [index, setIndex] = useState(0);
    const [rect, setRect] = useState<SpotlightRect | null>(null);
    const [targetAvailable, setTargetAvailable] = useState(false);
    const [resolvingTarget, setResolvingTarget] = useState(true);
    const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
    const coachRef = useRef<HTMLDivElement>(null);
    const step = steps[Math.min(index, Math.max(steps.length - 1, 0))];

    const exit = useCallback(() => onExit(), [onExit]);
    useDialogFocusTrap(coachRef, steps.length > 0 && !resolvingTarget, exit);

    useEffect(() => {
        const query = window.matchMedia('(max-width: 767px)');
        const update = () => setMobile(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        if (!step) return;

        let cancelled = false;
        let frame = 0;
        let followup = 0;
        setResolvingTarget(true);
        setTargetAvailable(false);
        setRect(null);

        const positionTarget = async () => {
            const target = await revealTourTarget(step.target);
            if (cancelled) return;

            if (!target) {
                if (index >= steps.length - 1) {
                    onFinish();
                    return;
                }
                setIndex((current) => current === index ? current + 1 : current);
                return;
            }

            setTargetAvailable(true);
            const box = target.getBoundingClientRect();
            const outsideViewport = box.top < 8 || box.bottom > window.innerHeight - 8;
            if (outsideViewport) {
                target.scrollIntoView({
                    block: 'center',
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                });
            }

            frame = window.requestAnimationFrame(() => {
                followup = window.requestAnimationFrame(() => {
                    if (cancelled) return;
                    const next = target.getBoundingClientRect();
                    setRect({
                        top: next.top,
                        left: next.left,
                        right: next.right,
                        bottom: next.bottom,
                        width: next.width,
                        height: next.height,
                    });
                    setResolvingTarget(false);
                });
            });
        };

        const update = () => {
            void positionTarget();
        };

        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            cancelled = true;
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
            window.cancelAnimationFrame(frame);
            window.cancelAnimationFrame(followup);
        };
    }, [index, onFinish, step, steps.length]);

    const placementStyle = useMemo(() => {
        if (mobile || !rect || typeof window === 'undefined') return undefined;
        const cardWidth = Math.min(360, window.innerWidth - 32);
        const roomRight = window.innerWidth - rect.right - 16;
        const left = roomRight >= cardWidth ? rect.right + 16 : Math.max(16, Math.min(rect.left, window.innerWidth - cardWidth - 16));
        const top = Math.max(16, Math.min(rect.top, window.innerHeight - 330));
        return { left, top };
    }, [mobile, rect]);

    if (!step || steps.length === 0 || resolvingTarget) return null;

    const next = () => {
        if (index === steps.length - 1) {
            onFinish();
            return;
        }
        setIndex((current) => current + 1);
    };

    return (
        <>
            <TourSpotlight rect={rect} />
            <TourCoachCard
                ref={coachRef}
                step={step}
                index={index}
                count={steps.length}
                targetAvailable={targetAvailable}
                mobile={mobile}
                placementStyle={placementStyle}
                onBack={() => setIndex((current) => Math.max(0, current - 1))}
                onNext={next}
                onExit={onExit}
            />
        </>
    );
}
