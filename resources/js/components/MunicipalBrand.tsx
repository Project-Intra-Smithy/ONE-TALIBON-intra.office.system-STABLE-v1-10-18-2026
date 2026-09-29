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
    return <div
        className={`municipal-brand flex min-w-0 items-center gap-3 ${inverse ? 'text-white' : 'text-[#163027] dark:text-slate-100'}`}
        aria-label={iconOnly ? `One Talibon · ${publicPortal ? 'Municipal Digital Portal' : 'LGU Intra-Office Portal'}` : undefined}
    >
        <img
            src={talibonAssets.municipalSeal}
            alt={iconOnly ? '' : 'Official seal of the Municipality of Talibon, Bohol'}
            className="h-11 w-11 shrink-0 rounded-full bg-white object-contain sm:h-12 sm:w-12"
        />
        {!iconOnly && <div className="min-w-0">
            <div className={`whitespace-nowrap font-extrabold leading-tight tracking-tight ${compact ? 'text-xl' : 'text-xl sm:text-2xl'}`}>
                <span className={inverse ? 'text-white' : 'text-[#19754b] dark:text-[#8ec9a0]'}>ONE</span> TALIBON
            </div>
            <div className={publicPortal
                ? 'mt-1 text-[10px] font-semibold uppercase leading-snug tracking-[.08em]'
                : 'mt-1 text-[10px] font-semibold uppercase leading-snug tracking-wider'
            }>{publicPortal ? 'Municipal Digital Portal' : 'LGU Intra-Office Portal'}</div>
        </div>}
    </div>;
}
