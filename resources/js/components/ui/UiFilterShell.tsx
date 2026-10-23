import type { ReactNode } from 'react';
import './ui-system.css';

export type UiFilterShellProps = {
    label?: string;
    controls: ReactNode;
    actions?: ReactNode;
    activeFilters?: ReactNode;
    className?: string;
};

/** Pure presentation; the caller owns query state, navigation and permission checks. */
export default function UiFilterShell({ label = 'Filters', controls, actions, activeFilters, className = '' }: UiFilterShellProps) {
    return <div className={`ot-ui-filters ${className}`.trim()} role="group" aria-label={label}>
        <div className="ot-ui-filters__main"><div className="ot-ui-filters__controls">{controls}</div>
            {actions && <div className="ot-ui-filters__actions">{actions}</div>}
        </div>
        {activeFilters && <div className="ot-ui-filters__active" aria-label="Active filters">{activeFilters}</div>}
    </div>;
}
