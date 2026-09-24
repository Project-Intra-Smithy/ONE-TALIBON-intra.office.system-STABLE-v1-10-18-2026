type Props = {
    offices: string[];
    size?: 'sm' | 'md';
};

function initials(office: string): string {
    return office
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

export default function GroupIdentity({ offices, size = 'md' }: Props) {
    const visible = offices.slice(0, 3);
    const dimensions = size === 'sm' ? 'h-7 w-7 text-[8px]' : 'h-9 w-9 text-[10px]';

    return (
        <div className="flex -space-x-2" aria-hidden="true">
            {visible.map((office, index) => (
                <div
                    key={office}
                    className={`${dimensions} flex items-center justify-center rounded-full border-2 border-[var(--municipal-surface)] bg-[var(--municipal-brand-soft)] font-bold text-[var(--municipal-brand)]`}
                    style={{ zIndex: visible.length - index }}
                    title={office}
                >
                    {initials(office)}
                </div>
            ))}
        </div>
    );
}
