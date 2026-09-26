import { router, usePage } from '@inertiajs/react';
import { CircleHelp, LogOut } from 'lucide-react';
import { useState } from 'react';
import { ONBOARDING_GUIDE_EVENT } from '../onboarding/types';
import type { AuthUser, SharedProps } from '../../types';
import WorkspaceSwitcher from '../showcase/WorkspaceSwitcher';
import SidebarAppearanceMenu from './SidebarAppearanceMenu';

type Props = {
    compact: boolean;
    user: AuthUser | null;
};

export default function SidebarFooter({ compact }: Props) {
    const [signingOut, setSigningOut] = useState(false);
    const { showcaseSession } = usePage<SharedProps>().props;

    const signOut = () => {
        if (signingOut) return;
        setSigningOut(true);
        router.post('/logout', {}, { onFinish: () => setSigningOut(false) });
    };

    const openGuidedTour = () => {
        window.dispatchEvent(new Event(ONBOARDING_GUIDE_EVENT));
    };

    return <details className="portal-account-tools" aria-busy={signingOut}><summary aria-label="Account and tools">{compact ? 'Tools' : 'Account & tools'}</summary><div className="flex flex-wrap justify-center gap-1">{showcaseSession?.active && <WorkspaceSwitcher compact />}{showcaseSession?.active && <button type="button" onClick={openGuidedTour} className="flex h-11 w-11 items-center justify-center" aria-label="Guided tour" title="Guided tour"><CircleHelp size={16} /></button>}<SidebarAppearanceMenu compact align="end" /><button type="button" onClick={signOut} disabled={signingOut} className="flex h-11 w-11 items-center justify-center disabled:opacity-60" aria-label={signingOut ? 'Signing out' : 'Sign out'} title="Sign out"><LogOut size={16} /></button></div></details>;
}
