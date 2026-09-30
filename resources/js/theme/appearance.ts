export type AppearancePreference = 'system' | 'light' | 'dark';
export type ResolvedAppearance = 'light' | 'dark';

const STORAGE_KEY = 'talibon.appearance';

function persistLightPreference(): void {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(STORAGE_KEY, 'light');
    } catch {
        // The showcase remains light even when storage is unavailable.
    }
}

export function readAppearance(): AppearancePreference {
    return 'light';
}

export function resolveAppearance(_preference: AppearancePreference): ResolvedAppearance {
    return 'light';
}

export function applyAppearance(_preference: AppearancePreference): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.remove('dark');
    root.dataset.appearance = 'light';
    root.style.colorScheme = 'light';
}

export function saveAppearance(_preference: AppearancePreference): void {
    persistLightPreference();
    applyAppearance('light');
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('talibon:appearance'));
}

export function initializeAppearance(): void {
    persistLightPreference();
    applyAppearance('light');
}

export function subscribeToSystemAppearance(_callback: () => void): () => void {
    return () => undefined;
}
