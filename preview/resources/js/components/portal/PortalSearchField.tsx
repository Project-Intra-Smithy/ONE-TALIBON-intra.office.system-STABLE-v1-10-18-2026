import { Search, X } from 'lucide-react';
import { useId, type InputHTMLAttributes } from 'react';
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string; onClear?: () => void; containerClassName?: string };
export default function PortalSearchField({ label, onClear, containerClassName = '', className = '', id, ...inputProps }: Props) {
    const generatedId = useId();
    const inputId = id || generatedId;
    return <div className={`municipal-search-field ${onClear ? 'municipal-search-field--clearable' : ''} ${containerClassName}`}>
        <label className="sr-only" htmlFor={inputId}>{label}</label>
        <Search size={17} className="municipal-search-icon" aria-hidden="true" />
        <input {...inputProps} id={inputId} type="search" className={`municipal-field municipal-search-input ${className}`} />
        {onClear && <button type="button" disabled={inputProps.disabled} onClick={onClear} className="municipal-search-clear" aria-label={`Clear ${label}`}><X size={16} aria-hidden="true" /></button>}
    </div>;
}
