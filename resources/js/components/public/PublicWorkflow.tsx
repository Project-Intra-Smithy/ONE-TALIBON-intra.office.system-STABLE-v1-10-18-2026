import { ArrowRight } from 'lucide-react';
import type { PublicContent } from './types';

export default function PublicWorkflow({ content }: { content: PublicContent }) {
    return <section id="workflow" className="public-official-information" aria-labelledby="public-workflow-title">
        <header className="public-official-header">
            <p className="public-official-kicker">{content.workflow.eyebrow}</p>
            <h2 id="public-workflow-title">{content.workflow.title}</h2>
            <p>{content.workflow.description}</p>
        </header>

        <ol className="grid grid-cols-1 border-y sm:grid-cols-5" style={{ borderColor: 'var(--public-divider)' }}>
            {content.workflow.steps.map((step, index) => <li
                key={step}
                className="flex min-h-20 items-center gap-3 border-b px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                style={{ borderColor: 'var(--public-divider)' }}
            >
                <span className="text-xs font-bold tabular-nums [color:var(--public-link)]">{String(index + 1).padStart(2, '0')}</span>
                <strong className="text-sm [color:var(--public-text)]">{step}</strong>
                {index < content.workflow.steps.length - 1 && <ArrowRight size={15} className="ml-auto hidden shrink-0 sm:block [color:var(--public-muted)]" aria-hidden="true" />}
            </li>)}
        </ol>
    </section>;
}
