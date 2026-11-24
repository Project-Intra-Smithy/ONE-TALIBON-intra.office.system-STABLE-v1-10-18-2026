import { useEffect, useState } from 'react';
import {
    applyAppearance,
    type AppearancePreference,
    readAppearance,
    resolveAppearance,
    type ResolvedAppearance,
    saveAppearance,
    subscribeToSystemAppearance,
} from './appearance';

export function useAppearance() {
    const [appearance, setAppearance] = useState<AppearancePreference>(readAppearance);
    const [systemScheme, setSystemScheme] = useState<ResolvedAppearance>(() => resolveAppearance('system'));

    useEffect(() => {
        const sync = () => setAppearance(readAppearance());
        window.addEventListener('talibon:appearance', sync);
        window.addEventListener('storage', sync);
        const unsubscribeSystem = subscribeToSystemAppearance(() => {
            setSystemScheme(resolveAppearance('system'));
            if (readAppearance() === 'system') {
                applyAppearance('system');
            }
        });
        return () => {
            window.removeEventListener('talibon:appearance', sync);
            window.removeEventListener('storage', sync);
            unsubscribeSystem();
        };
    }, []);

    useEffect(() => {
        applyAppearance(appearance);
    }, [appearance]);

    const resolved: ResolvedAppearance = appearance === 'system' ? systemScheme : appearance;

    return { appearance, resolved, systemScheme, choose: saveAppearance };
}
