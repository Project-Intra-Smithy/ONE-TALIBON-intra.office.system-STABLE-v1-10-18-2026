import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import './ui-system.css';

export type UiScrollAreaProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'aria-label'> & {
    label: string;
    maxHeight?: CSSProperties['maxHeight'];
    children: ReactNode;
};

/** Native keyboard-accessible region; narrow viewports expand to page scrolling. */
export default function UiScrollArea({ label, maxHeight, style, children, className = '', ...rest }: UiScrollAreaProps) {
    return <div {...rest} role="region" aria-label={label} tabIndex={0}
        className={`ot-ui-scroll-area ${className}`.trim()}
        style={maxHeight === undefined ? style : { ...style, maxHeight }}>{children}</div>;
}
