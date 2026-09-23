import type { AuthUser } from '../../types';

function initialsFor(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function PortalHeaderIdentity({ user }: { user: AuthUser | null }) {
    if (!user) return null;

    const office = user.employee?.department?.short_name || user.employee?.department?.name;
    const position = user.employee?.position;
    const identityTitle = [user.name, position, office].filter(Boolean).join(' · ');
    const context = [position, office].filter(Boolean).join(' · ');

    return (
        <div role="group" aria-label={`Signed in as ${identityTitle}`} className="flex min-w-0 items-center gap-2">
            <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--municipal-border)] bg-[var(--municipal-brand-soft)] text-xs font-bold text-[var(--municipal-brand-deep)] dark:text-[var(--municipal-brand)]"
                aria-hidden="true"
                title={identityTitle}
            >
                {initialsFor(user.name) || 'OT'}
            </span>
            <div className="hidden min-w-0 max-w-44 2xl:block">
                <div className="truncate text-xs font-bold leading-4 text-[var(--municipal-text)]" title={user.name}>{user.name}</div>
                {context && <div className="truncate text-xs leading-4 text-[var(--municipal-muted)]" title={context}>{context}</div>}
            </div>
        </div>
    );
}
