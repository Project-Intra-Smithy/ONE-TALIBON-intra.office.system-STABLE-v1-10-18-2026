/** Browser-only test bridge; never imported by the production application. */
import { router } from '@inertiajs/react';

export function setFixtureIdentity(id: number): void {
    // Inertia props change without a document reload: verify keyed TaskSession remount.
    router.replaceProp('auth.user.id', id);
}
