// UI-STAGE-001: these are the Inertia components present in this bundle.
// This is a link safety check, not a permission or backend route policy.
const stagedPaths = [
    /^\/dashboard\/?$/,
    /^\/transactions(?:\/create|\/\d+)?\/?$/,
    /^\/correspondence(?:\/[^/]+\/workspace)?\/?$/,
    /^\/records\/?$/,
    /^\/memoranda(?:\/create|\/\d+)?\/?$/,
    /^\/departments\/?$/,
    /^\/employees\/?$/,
    /^\/calendar\/?$/,
    /^\/security\/mfa(?:\/enroll|\/challenge|\/recovery-codes)?\/?$/,
    /^\/login\/?$/,
];

export function isStagedInertiaPath(url: string): boolean {
    if (!url.startsWith('/') || url.startsWith('//')) return false;
    const path = url.split(/[?#]/, 1)[0];
    return stagedPaths.some((route) => route.test(path));
}
