import UiEmptyState from './UiEmptyState';
import './ui-system.css';

export type UiLoadingStateProps = {
    label?: string;
    rows?: number;
    sessionExpired?: boolean;
    className?: string;
};

/** A session-expired consumer must not leave indistinguishable loading skeletons. */
export default function UiLoadingState({ label = 'Loading results', rows = 3, sessionExpired = false, className = '' }: UiLoadingStateProps) {
    if (sessionExpired) return <UiEmptyState kind="unavailable" title="Session expired" description="Sign in again to access this information." className={className} />;
    const count = Number.isFinite(rows) ? Math.max(1, Math.min(8, Math.floor(rows))) : 3;
    return <div className={`ot-ui-loading ${className}`.trim()} role="status" aria-live="polite" aria-busy="true">
        <span className="ot-ui-loading__label">{label}</span>
        <div className="ot-ui-loading__rows" aria-hidden="true">
            {Array.from({ length: count }, (_, index) => <div className="ot-ui-loading__row" key={index}>
                <span className="ot-ui-loading__square" /><span className="ot-ui-loading__line" />
            </div>)}
        </div>
    </div>;
}
