import { useEffect, useState } from 'react';

/** Multilingual support for Talibon LGU (English, Cebuano/Bisaya, Filipino). */
export type MunicipalLocale = 'en-PH' | 'ceb-PH' | 'fil-PH';

const LOCALE_STORAGE_KEY = 'talibon.locale';
const VALID_LOCALES: MunicipalLocale[] = ['en-PH', 'ceb-PH', 'fil-PH'];

export const LOCALE_OPTIONS: Array<{ value: MunicipalLocale; short: string; label: string }> = [
    { value: 'en-PH', short: 'EN', label: 'English' },
    { value: 'ceb-PH', short: 'CEB', label: 'Cebuano' },
    { value: 'fil-PH', short: 'FIL', label: 'Filipino' },
];

const dictionaries: Record<MunicipalLocale, Record<string, string>> = {
    'en-PH': {
        skipToMain: 'Skip to main content',
        searchRecordsPlaceholder: 'Search records…',
        searchButton: 'Search',
        newWorkRequest: 'New Work Request',
        signOut: 'Sign out',
        municipalityFooter: 'Municipality of Talibon · Province of Bohol',
        portalFooter: 'ONE TALIBON · Intra-Office Portal',
        navHome: 'Home',
        navTasks: 'Tasks',
        navRequests: 'Requests',
        navInbox: 'Inbox',
        navMore: 'More',
        quickJumpTitle: 'Quick Jump & Commands',
        quickJumpPlaceholder: 'Jump to workspace, planning map, or record…',
        quickJumpHint: 'Navigate with ↑↓ · Enter to open · Esc to close',
        quickJumpWorkspaces: 'Authorized Workspaces',
        quickJumpMaps: 'Talibon Planning Maps',
        quickJumpActions: 'Quick Actions',
        quickJumpEmpty: 'No matching workspaces — press Enter to search Municipal Records.',
        languageLabel: 'Language',
        recentActivity: 'Recent activity',
    },
    'ceb-PH': {
        skipToMain: 'Diretso sa unod',
        searchRecordsPlaceholder: 'Pangita og rekord…',
        searchButton: 'Pangita',
        newWorkRequest: 'Bag-ong Work Request',
        signOut: 'Gawas',
        municipalityFooter: 'Lungsod sa Talibon · Lalawigan sa Bohol',
        portalFooter: 'ONE TALIBON · Portal sa mga Opisina',
        navHome: 'Balay',
        navTasks: 'Buluhaton',
        navRequests: 'Hangyo',
        navInbox: 'Inbox',
        navMore: 'Dugang',
        quickJumpTitle: 'Dali nga Pag-abli ug Comando',
        quickJumpPlaceholder: 'Adto sa opisina, mapa sa plano, o rekord…',
        quickJumpHint: 'Gamita ang ↑↓ · Enter aron ablihan · Esc aron isira',
        quickJumpWorkspaces: 'Mga Awtorisadong Workspace',
        quickJumpMaps: 'Mga Mapa sa Plano sa Talibon',
        quickJumpActions: 'Dali nga Lihok',
        quickJumpEmpty: 'Walay kapareha — pindota ang Enter aron mangita sa Municipal Records.',
        languageLabel: 'Pinulongan',
        recentActivity: 'Bag-ong kalihokan',
    },
    'fil-PH': {
        skipToMain: 'Lumaktaw sa pangunahing nilalaman',
        searchRecordsPlaceholder: 'Maghanap ng tala…',
        searchButton: 'Hanapin',
        newWorkRequest: 'Bagong Work Request',
        signOut: 'Mag-sign out',
        municipalityFooter: 'Bayan ng Talibon · Lalawigan ng Bohol',
        portalFooter: 'ONE TALIBON · Intra-Office Portal',
        navHome: 'Tahanan',
        navTasks: 'Gawain',
        navRequests: 'Kahilingan',
        navInbox: 'Inbox',
        navMore: 'Iba pa',
        quickJumpTitle: 'Mabilisang Paghahanap at Utos',
        quickJumpPlaceholder: 'Pumunta sa workspace, mapa, o talaan…',
        quickJumpHint: 'Gamitin ang ↑↓ · Enter upang buksan · Esc upang isara',
        quickJumpWorkspaces: 'Awtorisadong Workspace',
        quickJumpMaps: 'Mga Mapa ng Plano ng Talibon',
        quickJumpActions: 'Mabilisang Aksyon',
        quickJumpEmpty: 'Walang tugma — pindutin ang Enter upang hanapin sa Municipal Records.',
        languageLabel: 'Wika',
        recentActivity: 'Kamakailang aktibidad',
    },
};

export function readLocale(): MunicipalLocale {
    if (typeof window === 'undefined') return 'en-PH';
    try {
        const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
        if (stored && VALID_LOCALES.includes(stored as MunicipalLocale)) {
            return stored as MunicipalLocale;
        }
    } catch {
        // Storage blocked
    }
    return 'en-PH';
}

export function saveLocale(locale: MunicipalLocale): void {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = locale;
    }
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        } catch {
            // Storage blocked
        }
        window.dispatchEvent(new Event('talibon:locale'));
    }
}

export function useLocale() {
    const [locale, setLocale] = useState<MunicipalLocale>(readLocale);

    useEffect(() => {
        const sync = () => {
            const next = readLocale();
            setLocale(next);
            if (typeof document !== 'undefined') {
                document.documentElement.lang = next;
            }
        };
        sync();
        window.addEventListener('talibon:locale', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('talibon:locale', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    return { locale, setLocale: saveLocale, t: (key: string) => t(key, locale) };
}

export function t(key: string, locale: MunicipalLocale = 'en-PH'): string {
    return dictionaries[locale]?.[key] ?? dictionaries['en-PH'][key] ?? key;
}
