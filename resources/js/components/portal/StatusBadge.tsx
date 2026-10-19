import type { CSSProperties, ReactNode } from 'react';
export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';
type Props = { label: ReactNode; tone?: StatusTone; className?: string };
export default function StatusBadge({ label, tone = 'neutral', className = '' }: Props) {
    const style: CSSProperties = { backgroundColor: `var(--municipal-status-${tone}-bg)`, color: `var(--municipal-status-${tone}-text)` };
    return <span className={`municipal-status-badge ${className}`} style={style}>{label}</span>;
}
