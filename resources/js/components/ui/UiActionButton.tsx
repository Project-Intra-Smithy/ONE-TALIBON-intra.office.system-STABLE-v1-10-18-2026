import { Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './ui-system.css';

export type UiActionVariant = 'primary' | 'secondary' | 'danger';
type SharedProps = { children: ReactNode; variant?: UiActionVariant; pending?: boolean; disabled?: boolean; className?: string };
type ActionProps = SharedProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled' | 'className'> & { href?: never };
type NavProps = SharedProps & { href: string; title?: string; 'aria-label'?: string };
export type UiActionButtonProps = ActionProps | NavProps;

/** Does not authorize actions. Disabled links are inert, not navigable. */
export default function UiActionButton(props: UiActionButtonProps) {
    const { children, variant = 'primary', pending = false, disabled = false, className = '' } = props;
    const classes = `ot-ui-action ot-ui-action--${variant} ${className}`.trim();
    const content = <>{pending && <LoaderCircle size={16} aria-hidden="true" className="ot-ui-action__loading" />}{children}</>;
    if ('href' in props && typeof props.href === 'string') {
        const { href, title, 'aria-label': ariaLabel } = props;
        if (disabled || pending) return <span className={classes} role="link" aria-disabled="true" aria-label={ariaLabel} title={title}>{content}</span>;
        return <Link href={href} className={classes} title={title} aria-label={ariaLabel}>{content}</Link>;
    }
    const { children: _children, variant: _variant, pending: _pending, className: _className, disabled: _disabled, ...buttonProps } = props as ActionProps;
    return <button {...buttonProps} type={buttonProps.type || 'button'} className={classes} disabled={disabled || pending} aria-busy={pending || undefined}>{content}</button>;
}
