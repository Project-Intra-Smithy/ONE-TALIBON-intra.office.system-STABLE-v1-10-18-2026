import { talibonAssets } from '../../branding/talibonAssets';
import { dashboardRoleLabel, dashboardScopeLabel } from './rolePresentation';
import type { DashboardExperience } from './types';

export default function DashboardPortalHero({ experience }: { experience: DashboardExperience }) {
    return <section className="dashboard-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(0,57,54,.96), rgba(0,66,62,.76) 48%, rgba(0,55,44,.28)), url(${talibonAssets.internalHero})` }} aria-labelledby="dashboard-welcome">
        <div className="dashboard-hero-copy"><p>Welcome to</p><h1 id="dashboard-welcome">Talibon Intra-Office Portal</h1><p className="dashboard-hero-description">Your central workspace for documents, coordination, communication, planning, monitoring, and internal LGU services.</p><div className="dashboard-hero-context">{dashboardRoleLabel(experience)} / {experience.department.shortName || experience.department.name} / {dashboardScopeLabel(experience)}</div></div>
        <div className="dashboard-hero-slogan" aria-hidden="true">One LGU.<br />One Portal.<br />One Talibon.</div>
    </section>;
}
