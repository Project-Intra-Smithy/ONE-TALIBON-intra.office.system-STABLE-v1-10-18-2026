import type { CSSProperties, PropsWithChildren } from 'react';
type Width = 'standard' | 'wide' | 'full';
type Props = PropsWithChildren<{ width?: Width; density?: 'default' | 'compact'; className?: string }>;
const widths: Record<Width, string> = { standard: '1152px', wide: '1440px', full: 'none' };
export default function PageFrame({ children, width = 'wide', density = 'default', className = '' }: Props) {
    // Existing explicit max-width utilities retain ownership until page-wave migration.
    const legacyWidth = /(?:^|\s)(?:[\w-]+:)*max-w-/.test(className);
    const style: CSSProperties = { ...(legacyWidth ? {} : { maxWidth: widths[width] }), '--municipal-page-gap': density === 'compact' ? '12px' : '16px' } as CSSProperties;
    return <div className={`municipal-page-frame mx-auto w-full min-w-0 ${className}`} style={style}>{children}</div>;
}
