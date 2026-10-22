import { Link } from '@inertiajs/react';
import { ArrowUpRight, Folder } from 'lucide-react';
import type { PortalDestinationKey, PortalNavigationItem } from '../../navigation/portalNavigation';
import { collectionLabels } from './documentCenterPresentation';
type Props = { collections: { value: string; label: string }[]; current: string; onSelect: (value: string) => void; workspaces: PortalNavigationItem[] };
const categories: { label: string; destination?: PortalDestinationKey }[] = [
    { label: 'Incoming Communications', destination: 'correspondence' }, { label: 'Outgoing Communications', destination: 'correspondence' },
    { label: 'Memoranda', destination: 'memoranda' }, { label: 'Executive Orders', destination: 'legislative' },
    { label: 'Office Orders', destination: 'records' }, { label: 'Special Orders', destination: 'records' },
    { label: 'Resolutions', destination: 'legislative' }, { label: 'Ordinances', destination: 'legislative' },
    { label: 'Contracts / MOAs / MOUs' }, { label: 'Certifications' }, { label: 'Endorsements', destination: 'correspondence' },
    { label: 'Permits and Clearances' }, { label: 'Reports' }, { label: 'Minutes', destination: 'meetings' },
    { label: 'Project Documents', destination: 'projectMonitoring' }, { label: 'Procurement Documents' },
    { label: 'Plans', destination: 'developmentPlans' }, { label: 'Technical Documents' }, { label: 'Archived Records' },
];
export default function DocumentCollectionNav({ collections, current, onSelect, workspaces }: Props) {
    const categoryLinks = <nav aria-label="Document categories">{categories.map((category) => {
        const destination = workspaces.find((item) => item.key === category.destination);
        if (destination) return <Link key={category.label} href={destination.href} className="dc-category" title={`Open ${destination.label}`}><Folder size={13} aria-hidden="true" /><span>{category.label}</span><ArrowUpRight size={11} className="dc-category-arrow" aria-hidden="true" /><span className="sr-only">Open {destination.label} workspace</span></Link>;
        return <span key={category.label} className="dc-category dc-category-unavailable" aria-disabled="true" title={category.destination ? 'Workspace not available to this account' : 'Collection not yet available'}><Folder size={13} aria-hidden="true" /><span>{category.label}</span><span className="sr-only">{category.destination ? 'Workspace not available to this account' : 'Collection not yet available'}</span></span>;
    })}</nav>;
    return <aside className="dc-rail" aria-label="Document categories"><h2 className="dc-rail-heading">Record collections</h2>
        <label className="dc-mobile-collection"><span className="sr-only">Record collection</span><select className="municipal-field w-full" value={current} onChange={(event) => onSelect(event.target.value)}>{collections.map((item) => <option key={item.value} value={item.value}>{collectionLabels[item.value] || item.label}</option>)}</select></label>
        <div className="dc-desktop-categories"><nav className="dc-collections" aria-label="Record collections">{collections.map((item) => <button key={item.value} type="button" onClick={() => onSelect(item.value)} aria-pressed={current === item.value} className="dc-category"><Folder size={13} aria-hidden="true" /><span>{collectionLabels[item.value] || item.label}</span></button>)}</nav>{categoryLinks}</div>
        <details className="dc-mobile-categories"><summary>Categories & workspaces</summary>{categoryLinks}</details>
    </aside>;
}
