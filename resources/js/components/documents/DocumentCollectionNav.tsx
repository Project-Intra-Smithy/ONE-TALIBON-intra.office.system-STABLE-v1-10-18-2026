import { Link } from '@inertiajs/react';
import { ArrowUpRight, Folder, Info } from 'lucide-react';
import type { PortalNavigationItem } from '../../navigation/portalNavigation';
import { collectionLabels } from './documentCenterPresentation';

type Props = {
    collections: { value: string; label: string }[];
    current: string;
    onSelect: (value: string) => void;
    workspaces: PortalNavigationItem[];
};

/**
 * Only server-provided record types filter the Document Center. Other workspaces
 * are separate processes, not disguised as document folders.
 */
export default function DocumentCollectionNav({ collections, current, onSelect, workspaces }: Props) {
    const collectionButtons = (
        <nav className="dc-collections" aria-label="Record collections">
            {collections.map(item => (
                <button key={item.value} type="button" onClick={() => onSelect(item.value)}
                    aria-pressed={current === item.value} className="dc-category">
                    <Folder size={13} aria-hidden="true" />
                    <span>{collectionLabels[item.value] || item.label}</span>
                </button>
            ))}
        </nav>
    );
    const related = workspaces.filter((item, index, all) =>
        all.findIndex(other => other.href === item.href) === index,
    );
    const relatedLinks = (
        <nav aria-label="Related workspaces" className="space-y-1">
            {related.map(item => (
                <Link key={item.key} href={item.href} className="dc-category"
                    title={`Leave Document Center and open ${item.label}`}>
                    <ArrowUpRight size={13} aria-hidden="true" />
                    <span>{item.label} <span className="text-[10px] opacity-70">(separate workspace)</span></span>
                </Link>
            ))}
        </nav>
    );
    return (
        <aside className="dc-rail" aria-label="Document collections and related workspaces">
            <h2 className="dc-rail-heading">Browse records here</h2>
            <p className="mb-2 text-xs text-[var(--municipal-muted)]">
                These filters stay in Document Center and show authorized records only.
            </p>
            <label className="dc-mobile-collection">
                <span className="sr-only">Record collection</span>
                <select className="municipal-field w-full" value={current}
                    onChange={event => onSelect(event.target.value)}>
                    {collections.map(item => <option key={item.value} value={item.value}>
                        {collectionLabels[item.value] || item.label}
                    </option>)}
                </select>
            </label>
            <div className="dc-desktop-categories">{collectionButtons}</div>
            <details className="dc-mobile-categories">
                <summary>Available record collections</summary>
                {collectionButtons}
            </details>
            {related.length > 0 && (
                <details className="mt-3 border-t border-[var(--municipal-border)] pt-3">
                    <summary className="cursor-pointer text-xs font-bold text-[var(--municipal-text)]">
                        Related workspaces (opens another page)
                    </summary>
                    <p className="my-2 text-xs text-[var(--municipal-muted)]">
                        These links manage source work; they are not document filters.
                    </p>
                    {relatedLinks}
                </details>
            )}
            <p role="note" className="mt-3 flex gap-2 text-xs text-[var(--municipal-muted)]">
                <Info size={15} className="shrink-0" aria-hidden="true" />
                Not every municipal document type is indexed yet. Use Attached Files to browse available authorized uploads.
            </p>
        </aside>
    );
}
