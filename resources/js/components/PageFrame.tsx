import type { PropsWithChildren } from 'react';

type Width = 'standard' | 'wide';
type Density = 'compact' | 'standard' | 'comfortable';
type Props = PropsWithChildren<{ width?: Width; className?: string; density?: Density }>;

const widths: Record<Width, string> = {
    standard: 'max-w-6xl',
    wide: 'max-w-7xl',
};

export default function PageFrame({ children, width = 'wide', density = 'standard', className = '' }: Props) {
    return (
        <div className={`mx-auto w-full min-w-0 ${widths[width]} ${density === 'compact' ? 'space-y-3 sm:space-y-4' : density === 'comfortable' ? 'space-y-6 sm:space-y-8' : 'space-y-5 sm:space-y-6'} pb-8 ${className}`}>
            {children}
        </div>
    );
}
