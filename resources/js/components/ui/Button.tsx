import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    children: ReactNode;
};

const variantClasses: Record<Variant, string> = {
    primary: 'border border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]',
    secondary: 'border border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]',
    ghost: 'border border-transparent bg-transparent text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]',
    danger: 'border border-[var(--status-danger-bar)] bg-[var(--status-danger-bar)] text-white hover:opacity-90',
};

const sizeClasses: Record<Size, string> = {
    md: 'min-h-11 px-4 py-2 text-sm',
    sm: 'min-h-11 px-3 py-1.5 text-sm',
};

export function Button({
    type = 'button',
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
