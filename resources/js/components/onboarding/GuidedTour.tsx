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

function tourTarget(target: string): HTMLElement | null {
    return tourCandidates(target)
        .find((element) => element.offsetParent !== null) ?? null;
}

function isExactVisibleTarget(element: HTMLElement | null, target: string): element is HTMLElement {
    return Boolean(
        element
        && element.isConnected
        && element.offsetParent !== null
        && element.dataset.tour === target,
    );
}

function visibleNavigationToggle(): HTMLButtonElement | null {
    return Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-label="Open navigation"]'))
        .find((button) => button.offsetParent !== null) ?? null;
}

function visibleNavigationClose(): HTMLButtonElement | null {
    return Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-label="Close navigation"]'))
        .find((button) => button.offsetParent !== null) ?? null;
}

function settleLayout(): Promise<void> {
    return new Promise((resolve) => {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => resolve());
        });
    });
}

function targetUsesMobileNavigation(target: string): boolean {
    return target.startsWith('nav:') || target === 'shell:workspace-switcher';
}

async function revealTourTarget(target: string, onNavigationOpened: () => void): Promise<HTMLElement | null> {
    const visible = tourTarget(target);
    if (visible) return visible;

    if (!targetUsesMobileNavigation(target)) return null;

    const navigationToggle = visibleNavigationToggle();
    if (!navigationToggle) return null;

    navigationToggle.click();
    onNavigationOpened();
    await settleLayout();

    return tourTarget(target);
}

function scrollTargetIntoComfortableView(target: HTMLElement, mobile: boolean): boolean {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth';
    const targetBox = target.getBoundingClientRect();

    if (mobile) {
        const navigation = target.closest<HTMLElement>('nav[aria-label="Primary navigation"]');
        if (navigation) {
            const navigationBox = navigation.getBoundingClientRect();
            const comfortInset = Math.min(88, navigationBox.height * 0.22);
            const comfortTop = navigationBox.top + comfortInset;
            const comfortBottom = navigationBox.bottom - comfortInset;

            if (targetBox.top < comfortTop || targetBox.bottom > comfortBottom) {
                const targetCenter = (targetBox.top + targetBox.bottom) / 2;
                const navigationCenter = (navigationBox.top + navigationBox.bottom) / 2;
                navigation.scrollBy({ top: targetCenter - navigationCenter, behavior });
                return true;
            }

            return false;
        }
    }

    const outsideViewport = targetBox.top < 8 || targetBox.bottom > window.innerHeight - 8;
    if (!outsideViewport) return false;

    target.scrollIntoView({ block: 'center', behavior });
    return true;
}

function spotlightRect(target: HTMLElement): SpotlightRect {
    const box = target.getBoundingClientRect();
    return {
        top: box.top,
        left: box.left,
        right: box.right,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
    };
}

export default function GuidedTour({ steps, onExit, onFinish }: Props) {
    const [index, setIndex] = useState(0);
    const [rect, setRect] = useState<SpotlightRect | null>(null);
    const [targetAvailable, setTargetAvailable] = useState(false);
    const [resolvingTarget, setResolvingTarget] = useState(true);
    const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
    const coachRef = useRef<HTMLDivElement>(null);
    const openedMobileNavigationRef = useRef(false);
    const step = steps[Math.min(index, Math.max(steps.length - 1, 0))];

    const closeTourNavigation = useCallback(() => {
        if (!openedMobileNavigationRef.current) return;
        visibleNavigationClose()?.click();
        openedMobileNavigationRef.current = false;
    }, []);

    const exit = useCallback(() => {
        closeTourNavigation();
        onExit();
    }, [closeTourNavigation, onExit]);

    const finish = useCallback(() => {
        closeTourNavigation();
        onFinish();
    }, [closeTourNavigation, onFinish]);

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
        let resolutionId = 0;
        let measurementFrame = 0;
        let activeTarget: HTMLElement | null = null;

        setResolvingTarget(true);
        setTargetAvailable(false);
        setRect(null);

        const requestMissingTargetAdvance = (requestId: number) => {
            if (cancelled || requestId !== resolutionId) return;
            activeTarget = null;
            setRect(null);
            setTargetAvailable(false);

            if (index >= steps.length - 1) {
                finish();
                return;
            }

            setIndex((current) => current === index ? current + 1 : current);
        };

        const resolveCurrentTarget = async () => {
            const requestId = ++resolutionId;
            setResolvingTarget(true);
            setTargetAvailable(false);
            setRect(null);

            const resolved = await revealTourTarget(step.target, () => {
                openedMobileNavigationRef.current = true;
            });
            if (cancelled || requestId !== resolutionId) return;

            if (!isExactVisibleTarget(resolved, step.target)) {
                requestMissingTargetAdvance(requestId);
                return;
            }

            const scrolled = scrollTargetIntoComfortableView(resolved, mobile);
            if (scrolled) await settleLayout();
            if (cancelled || requestId !== resolutionId) return;

            const exactTarget = tourTarget(step.target);
            if (!isExactVisibleTarget(exactTarget, step.target)) {
                requestMissingTargetAdvance(requestId);
                return;
            }

            activeTarget = exactTarget;
            setRect(spotlightRect(exactTarget));
            setTargetAvailable(true);
            setResolvingTarget(false);
        };

        const scheduleMeasurement = () => {
            window.cancelAnimationFrame(measurementFrame);
            measurementFrame = window.requestAnimationFrame(() => {
                if (cancelled) return;
                if (!isExactVisibleTarget(activeTarget, step.target)) {
                    void resolveCurrentTarget();
                    return;
                }
                setRect(spotlightRect(activeTarget));
            });
        };

        const updatePosition = () => {
            if (!activeTarget) return;
            scheduleMeasurement();
        };

        void resolveCurrentTarget();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            cancelled = true;
            resolutionId += 1;
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            window.cancelAnimationFrame(measurementFrame);
        };
    }, [finish, index, mobile, step, steps.length]);

    const coachPlacement = useMemo(() => {
        if (!rect || typeof window === 'undefined') {
            return { mobilePlacement: undefined as 'top' | 'bottom' | undefined, style: undefined };
        }

        if (mobile) {
            const gap = 16;
            const safeMargin = 12;
            const viewportHeight = window.innerHeight;
            const roomAbove = Math.max(0, rect.top - gap - safeMargin);
            const roomBelow = Math.max(0, viewportHeight - rect.bottom - gap - safeMargin);
            const targetCenter = (rect.top + rect.bottom) / 2;
            let mobilePlacement: 'top' | 'bottom' = targetCenter <= viewportHeight / 2 ? 'bottom' : 'top';
            const preferredRoom = mobilePlacement === 'bottom' ? roomBelow : roomAbove;
            const alternateRoom = mobilePlacement === 'bottom' ? roomAbove : roomBelow;

            if (preferredRoom < 180 && alternateRoom > preferredRoom) {
                mobilePlacement = mobilePlacement === 'bottom' ? 'top' : 'bottom';
            }

            const maxHeight = mobilePlacement === 'bottom'
                ? `min(48dvh, calc(100dvh - ${Math.ceil(rect.bottom + gap + safeMargin)}px - env(safe-area-inset-bottom)))`
                : `min(48dvh, calc(${Math.max(0, Math.floor(rect.top - gap - safeMargin))}px - env(safe-area-inset-top)))`;

            return {
                mobilePlacement,
                style: {
                    left: 'max(0.75rem, env(safe-area-inset-left))',
                    right: 'max(0.75rem, env(safe-area-inset-right))',
                    maxHeight,
                    ...(mobilePlacement === 'bottom'
                        ? { bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }
                        : { top: 'max(0.75rem, env(safe-area-inset-top))' }),
                },
            };
        }

        const cardWidth = Math.min(360, window.innerWidth - 32);
        const roomRight = window.innerWidth - rect.right - 16;
        const left = roomRight >= cardWidth
            ? rect.right + 16
            : Math.max(16, Math.min(rect.left, window.innerWidth - cardWidth - 16));
        const top = Math.max(16, Math.min(rect.top, window.innerHeight - 330));

        return {
            mobilePlacement: undefined as 'top' | 'bottom' | undefined,
            style: { left, top },
        };
    }, [mobile, rect]);

    if (!step || steps.length === 0 || resolvingTarget) return null;

    const next = () => {
        if (index === steps.length - 1) {
            finish();
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
                mobilePlacement={coachPlacement.mobilePlacement}
                placementStyle={coachPlacement.style}
                onBack={() => setIndex((current) => Math.max(0, current - 1))}
                onNext={next}
                onExit={exit}
            />
        </>
    );
}
