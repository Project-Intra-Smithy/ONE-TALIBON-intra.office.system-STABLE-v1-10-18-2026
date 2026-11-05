import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
    label: string;
    itemCount: number;
    className?: string;
}>;

/**
 * Small dashboard collections retain native scrolling instead of adopting a JS
 * virtualization layer. Headers and footer stay outside the scroll viewport.
 * On narrow/touch layouts the viewport expands to avoid nested page scrolling.
 */
export default function DashboardScrollRegion({ label, itemCount, className = '', children }: Props) {
    const keyboardRegion = itemCount >= 4;
    return <div
        className={`ot-dashboard-scroll-region ${className}`.trim()}
        role={keyboardRegion ? 'region' : undefined}
        aria-label={keyboardRegion ? label : undefined}
        tabIndex={keyboardRegion ? 0 : undefined}
    >{children}</div>;
}
