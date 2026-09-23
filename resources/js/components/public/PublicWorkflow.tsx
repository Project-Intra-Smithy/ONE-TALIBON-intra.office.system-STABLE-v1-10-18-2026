import { ArrowRight } from 'lucide-react';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PublicContent } from './types';

export default function PublicWorkflow({ content }: { content: PublicContent }) {
    return <section
        id="workflow"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} border-t py-12 md:py-16 lg:py-20 [border-color:var(--public-divider)]`}
        aria-labelledby="public-workflow-title"
    >
        <header className="mb-7 max-w-3xl md:mb-9">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] [color:var(--public-link)]">{content.workflow.eyebrow}</p>
            <h2 id="public-workflow-title" className="mt-2 text-2xl font-extrabold tracking-[-0.025em] [color:var(--public-text)] md:text-3xl">{content.workflow.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 [color:var(--public-muted)]">{content.workflow.description}</p>
        </header>

        <ol className="grid grid-cols-1 gap-0 lg:grid-cols-5">
            {content.workflow.steps.map((step, index) => <li key={step.title} className="relative grid min-w-0 grid-cols-[44px_minmax(0,1fr)] gap-3 pb-6 last:pb-0 lg:grid-cols-1 lg:gap-3 lg:border-t lg:px-4 lg:pb-0 lg:pt-5 first:lg:pl-0 last:lg:pr-0 [border-color:var(--public-divider)]">
                <div className="relative flex justify-center lg:justify-start">
                    <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-[11px] font-extrabold tabular-nums [border-color:var(--public-divider-strong)] [background:var(--public-surface)] [color:var(--public-link)]">{String(index + 1).padStart(2, '0')}</span>
                    {index < content.workflow.steps.length - 1 && <span className="absolute left-1/2 top-9 h-[calc(100%+24px)] w-px -translate-x-1/2 lg:hidden [background:var(--public-divider)]" aria-hidden="true" />}
                </div>
                <div className="min-w-0 pt-1 lg:pt-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold uppercase tracking-[0.035em] [color:var(--public-text)]">{step.title}</h3>
                        {index < content.workflow.steps.length - 1 && <ArrowRight size={15} className="ml-auto hidden shrink-0 lg:block [color:var(--public-muted)]" aria-hidden="true" />}
                    </div>
                    <p className="mt-2 max-w-[220px] text-[12px] leading-5 [color:var(--public-muted)]">{step.description}</p>
                </div>
            </li>)}
        </ol>
    </section>;
}
