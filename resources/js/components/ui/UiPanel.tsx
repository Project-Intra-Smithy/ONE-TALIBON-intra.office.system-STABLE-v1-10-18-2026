import type { HTMLAttributes, ReactNode } from 'react';
import './ui-system.css';

export type UiPanelDensity = 'compact' | 'standard';
export type UiPanelProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
    as?: 'div' | 'article' | 'section';
    density?: UiPanelDensity;
    header?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
};

/** Layout only: consumer supplies section labelling and authorized content. */
export default function UiPanel({ as: Element = 'div', density = 'standard', header, footer, children, className = '', ...rest }: UiPanelProps) {
    return <Element {...rest} className={`ot-ui-panel ot-ui-panel--${density} ${className}`.trim()}>
        {header && <div className="ot-ui-panel__header">{header}</div>}
        <div className="ot-ui-panel__body">{children}</div>
        {footer && <div className="ot-ui-panel__footer">{footer}</div>}
    </Element>;
}
