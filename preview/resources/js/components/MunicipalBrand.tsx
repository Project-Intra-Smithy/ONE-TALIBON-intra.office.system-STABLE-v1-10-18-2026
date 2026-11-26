import { talibonAssets } from '../branding/talibonAssets';

type Props = {
    inverse?: boolean;
    compact?: boolean;
    publicPortal?: boolean;
    iconOnly?: boolean;
};

export default function MunicipalBrand({
    inverse = false,
    compact = false,
    publicPortal = false,
    iconOnly = false,
}: Props) {
    return (
        <div
            className={`flex min-w-0 items-center gap-2.5 ${inverse ? 'text-white' : 'text-[var(--ink-primary)]'}`}
            aria-label={iconOnly ? `ONE TALIBON · ${publicPortal ? 'Municipal Public Portal' : 'Municipality of Talibon'}` : undefined}
        >
            <img
                src={talibonAssets.municipalSeal}
                alt={iconOnly ? '' : 'Official seal of the Municipality of Talibon'}
                width={38}
                height={38}
                className="h-9 w-9 shrink-0 rounded-full object-contain"
            />
            {!iconOnly && (
                <div className="min-w-0">
                    <div className={`truncate font-extrabold leading-tight tracking-tight ${compact ? 'text-base' : 'text-lg sm:text-xl'}`}>
                        <span className={inverse ? 'text-white' : 'text-[var(--brand-primary)]'}>ONE</span> TALIBON
                    </div>
                    <div
                        className={`truncate text-xs font-medium leading-tight ${
                            inverse ? 'text-[var(--surface-sidebar-muted)]' : 'text-[var(--ink-secondary)]'
                        }`}
                    >
                        {publicPortal ? 'Municipal Public Portal' : 'Municipality of Talibon'}
                    </div>
                </div>
            )}
        </div>
    );
}
