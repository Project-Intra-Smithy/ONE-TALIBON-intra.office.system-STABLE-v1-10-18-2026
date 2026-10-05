import { ShieldAlert } from 'lucide-react';
import PageFrame from '../PageFrame';
import PageHeader from '../PageHeader';

type Props = {
    title: string;
    description: string;
    missing: string;
    treatment: string;
    dependency: string;
};

export default function AuthorityPendingSurface({ title, description, missing, treatment, dependency }: Props) {
    return (
        <PageFrame width="standard" density="compact">
            <PageHeader
                eyebrow="Pending authoritative LGU input"
                title={title}
                description={description}
                icon={ShieldAlert}
            />

            <section
                role="note"
                aria-label={`${title} authority status`}
                className="municipal-panel grid gap-3 p-4 md:grid-cols-3"
            >
                <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">What is missing</div>
                    <p className="mt-1 text-sm leading-5 text-[var(--municipal-text)]">{missing}</p>
                </div>
                <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Current product treatment</div>
                    <p className="mt-1 text-sm leading-5 text-[var(--municipal-text)]">{treatment}</p>
                </div>
                <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Required authority / contract</div>
                    <p className="mt-1 text-sm leading-5 text-[var(--municipal-text)]">{dependency}</p>
                </div>
            </section>
        </PageFrame>
    );
}
