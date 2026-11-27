import { type ReactNode, useId, useState } from 'react';
import { Dialog } from '../ui';

export type PlanDossierSection = { key: string; label: string; content: ReactNode };

/** Runtime adapters supply authorized records and actions; this view owns only dossier interaction. */
export default function PlanDossierPresentation({ open, title, description, onClose, sections, footer, sectionLabel = 'Development plan dossier sections', activeSection, onSectionChange, id }: {
    open: boolean;
    title: string;
    description?: string;
    onClose: () => void;
    sections: PlanDossierSection[];
    footer?: ReactNode;
    sectionLabel?: string;
    activeSection?: string;
    onSectionChange?: (section:string)=>void;
    id?: string;
}) {
    const [selected, setSelected] = useState(sections[0]?.key);
    const generatedId = useId();
    const tabId = id ?? generatedId;
    const active = sections.find(section => section.key === (activeSection ?? selected)) ?? sections[0];
    const select = (key:string)=>{setSelected(key);onSectionChange?.(key);};
    return <Dialog id={id} open={open} onClose={onClose} title={title} description={description} size="xl" footer={footer}>
        <div role="tablist" aria-label={sectionLabel} className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-recessed)] p-1 sm:grid-cols-4">
            {sections.map((section, index) => <button key={section.key} type="button" role="tab"
                id={`${tabId}-${section.key}-tab`} aria-controls={`${tabId}-${section.key}-panel`}
                aria-selected={active?.key === section.key} tabIndex={active?.key === section.key ? 0 : -1}
                onClick={() => select(section.key)}
                onKeyDown={event => {
                    const next = event.key === 'ArrowRight' ? (index + 1) % sections.length
                        : event.key === 'ArrowLeft' ? (index + sections.length - 1) % sections.length
                        : event.key === 'Home' ? 0 : event.key === 'End' ? sections.length - 1 : null;
                    if (next === null) return;
                    event.preventDefault();
                    select(sections[next].key);
                    document.getElementById(`${tabId}-${sections[next].key}-tab`)?.focus();
                }}
                className={`min-h-11 rounded-lg border px-2 text-xs font-bold ${active?.key === section.key ? 'border-[var(--brand-soft-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]' : 'border-transparent text-[var(--ink-secondary)]'}`}>
                {section.label}
            </button>)}
        </div>
        {active && <div role="tabpanel" id={`${tabId}-${active.key}-panel`} aria-labelledby={`${tabId}-${active.key}-tab`} tabIndex={0} className="mt-4 min-w-0">{active.content}</div>}
    </Dialog>;
}
