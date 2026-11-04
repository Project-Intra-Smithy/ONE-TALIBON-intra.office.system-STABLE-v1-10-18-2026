import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import './ui-system.css';

export type UiPanelHeaderProps = {
    title: ReactNode;
    headingId?: string;
    headingLevel?: 'h2' | 'h3' | 'h4';
    icon?: LucideIcon;
    count?: number;
    actions?: ReactNode;
    emphasis?: 'neutral' | 'municipal';
    className?: string;
};

export default function UiPanelHeader({ title, headingId, headingLevel: Heading = 'h2', icon: Icon, count, actions, emphasis = 'neutral', className = '' }: UiPanelHeaderProps) {
    return <div className={`ot-ui-panel-heading ot-ui-panel-heading--${emphasis} ${className}`.trim()}>
        <div className="ot-ui-panel-heading__identity">
            {Icon && <Icon size={17} strokeWidth={1.8} aria-hidden="true" className="ot-ui-panel-heading__icon" />}
            <Heading id={headingId} className="ot-ui-panel-heading__title">{title}</Heading>
            {count !== undefined && <span className="ot-ui-panel-heading__count" aria-label={`${count} items`}>{count.toLocaleString('en-PH')}</span>}
        </div>
        {actions && <div className="ot-ui-panel-heading__actions">{actions}</div>}
    </div>;
}
