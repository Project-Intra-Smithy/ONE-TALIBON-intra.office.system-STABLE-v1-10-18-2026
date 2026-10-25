import { CircleHelp, Inbox, LockKeyhole, ShieldAlert, WifiOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import './ui-system.css';

export type UiEmptyKind = 'empty' | 'unauthorized' | 'unavailable' | 'pending-authority';
export type UiEmptyStateProps = {
    kind?: UiEmptyKind;
    title: string;
    description?: ReactNode;
    icon?: LucideIcon;
    action?: ReactNode;
    className?: string;
};
const kindIcons = { empty: Inbox, unauthorized: LockKeyhole, unavailable: WifiOff, 'pending-authority': ShieldAlert } satisfies Record<UiEmptyKind, LucideIcon>;

/** Distinct semantic states: access denial is never rendered as an ordinary empty list. */
export default function UiEmptyState({ kind = 'empty', title, description, icon, action, className = '' }: UiEmptyStateProps) {
    const Icon = icon || kindIcons[kind] || CircleHelp;
    return <div className={`ot-ui-empty ot-ui-empty--${kind} ${className}`.trim()} role={kind === 'unauthorized' ? 'alert' : 'status'}>
        <Icon size={22} aria-hidden="true" className="ot-ui-empty__icon" />
        <div className="ot-ui-empty__title">{title}</div>
        {description && <p className="ot-ui-empty__description">{description}</p>}
        {action && <div className="ot-ui-empty__action">{action}</div>}
    </div>;
}
