import { router } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import type { AuthUser } from '../../types';

type Props = {
    compact: boolean;
    user: AuthUser | null;
};

export default function SidebarFooter({ compact }: Props) {
    const [signingOut, setSigningOut] = useState(false);

    const signOut = () => {
        if (signingOut) return;
        setSigningOut(true);
        router.post('/logout', {}, { onFinish: () => setSigningOut(false) });
    };

    return (
        <div className="space-y-1.5" aria-busy={signingOut}>
            <details className="portal-account-tools">
                <summary aria-label="Account and tools">{compact ? 'Tools' : 'Account & tools'}</summary>
                <div className="flex flex-wrap justify-center gap-1">
                    <button
                        type="button"
                        onClick={signOut}
                        disabled={signingOut}
                        className="flex h-11 w-11 items-center justify-center disabled:opacity-60"
                        aria-label={signingOut ? 'Signing out' : 'Sign out'}
                        title="Sign out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </details>
        </div>
    );
}
