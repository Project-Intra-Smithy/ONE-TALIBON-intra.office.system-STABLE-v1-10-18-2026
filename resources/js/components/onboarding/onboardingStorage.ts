import type { PersonaTourKey } from './types';

const INTRO_KEY = 'talibon.onboarding.intro.v1';
const TOUR_PREFIX = 'talibon.onboarding.tour.v1.';
const COMPLETED = 'completed';

const memoryFallback = new Map<string, string>();
const personaOffersSeenThisSession = new Set<PersonaTourKey>();

function readValue(key: string): string | null {
    if (typeof window === 'undefined') return memoryFallback.get(key) ?? null;

    for (const storageName of ['localStorage', 'sessionStorage'] as const) {
        try {
            const value = window[storageName].getItem(key);
            if (value !== null) return value;
        } catch {
            // Onboarding must never block the workspace when browser storage is unavailable.
        }
    }

    return memoryFallback.get(key) ?? null;
}

function writeValue(key: string, value: string): void {
    memoryFallback.set(key, value);
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(key, value);
        return;
    } catch {
        // Fall through to session storage.
    }

    try {
        window.sessionStorage.setItem(key, value);
    } catch {
        // In-memory state already preserves this mounted application session.
    }
}

const tourKey = (persona: PersonaTourKey) => TOUR_PREFIX + persona;

export function hasCompletedIntroduction(): boolean {
    return readValue(INTRO_KEY) === COMPLETED;
}

export function markIntroductionCompleted(): void {
    writeValue(INTRO_KEY, COMPLETED);
}

export function hasCompletedPersonaTour(persona: PersonaTourKey): boolean {
    return readValue(tourKey(persona)) === COMPLETED;
}

export function markPersonaTourCompleted(persona: PersonaTourKey): void {
    writeValue(tourKey(persona), COMPLETED);
}

export function hasSeenPersonaOfferThisSession(persona: PersonaTourKey): boolean {
    return personaOffersSeenThisSession.has(persona);
}

export function markPersonaOfferSeenThisSession(persona: PersonaTourKey): void {
    personaOffersSeenThisSession.add(persona);
}
