import { talibonAssets } from '../../branding/talibonAssets';
type Props = { compact: boolean; mobile: boolean };
export default function SidebarBrand({ compact }: Props) {
    return <div className="portal-sidebar-brand"><img src={talibonAssets.municipalSeal} alt="Municipality of Talibon seal" />{!compact && <div><strong>ONE TALIBON</strong><span>Municipality of Talibon</span></div>}</div>;
}
