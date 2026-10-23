import { useId, type ReactNode } from 'react';
import UiEmptyState, { type UiEmptyKind } from './UiEmptyState';
import UiLoadingState from './UiLoadingState';
import UiPanel from './UiPanel';
import UiPanelHeader from './UiPanelHeader';
import './ui-system.css';

export type UiDataRegionState = 'ready' | 'loading' | UiEmptyKind;
export type UiDataRegionProps = {
    title: string;
    titleId?: string;
    resultCount?: number;
    filters?: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
    state?: UiDataRegionState;
    stateTitle?: string;
    stateDescription?: ReactNode;
    stateAction?: ReactNode;
    density?: 'compact' | 'standard';
    className?: string;
};

/** Frame for caller-supplied server-authorized rows; never filters or paginates data. */
export default function UiDataRegion({ title, titleId, resultCount, filters, actions, children, state = 'ready', stateTitle, stateDescription, stateAction, density = 'standard', className = '' }: UiDataRegionProps) {
    const fallbackId = useId();
    const headingId = titleId || fallbackId;
    return <UiPanel as="section" density={density} aria-labelledby={headingId} aria-busy={state === 'loading'} className={`ot-ui-data ${className}`.trim()}
        header={<UiPanelHeader headingId={headingId} title={title} count={state === 'ready' || state === 'empty' ? resultCount : undefined} actions={actions} />}>
        {filters && (state === 'ready' || state === 'empty') && <div className="ot-ui-data__filters">{filters}</div>}
        {state === 'loading' ? <UiLoadingState label={`Loading ${title}`} /> : state !== 'ready' ?
            <UiEmptyState kind={state} title={stateTitle || (state === 'empty' ? 'No results' : state === 'unauthorized' ? 'Access denied' : state === 'pending-authority' ? 'Pending authorization' : 'Information unavailable')} description={stateDescription} action={stateAction} /> :
            <div className="ot-ui-data__viewport" role="region" aria-label={`${title} results`} tabIndex={0}>{children}</div>}
    </UiPanel>;
}
