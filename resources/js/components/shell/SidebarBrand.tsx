import { talibonAssets } from '../../branding/talibonAssets';
import MunicipalBrand from '../MunicipalBrand';

type Props = {
    compact: boolean;
    portal?: boolean;
    mobile: boolean;
};

export default function SidebarBrand({ compact, portal }: Props) {
    if (portal) return <div className="portal-sidebar-brand"><img src={talibonAssets.municipalSeal} alt="Municipality of Talibon seal" />{!compact && <div><strong>ONE TALIBON</strong><span>Municipality of Talibon</span></div>}</div>;
    return (
        <div className={`border-b border-white/10 ${compact ? 'px-2 py-2.5' : 'px-3 py-2.5'}`}>
            <div className={compact ? 'flex justify-center' : undefined}>
                <MunicipalBrand inverse compact iconOnly={compact} />
            </div>
        </div>
    );
}
