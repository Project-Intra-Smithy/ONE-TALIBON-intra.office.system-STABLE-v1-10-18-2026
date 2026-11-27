import { Link } from '@inertiajs/react';
import { ArrowLeft, Info } from 'lucide-react';
import { PageHeader } from '../ui';

type Props = {
    title: string;
    description: string;
    missing: string;
    treatment: string;
    dependency: string;
};

/** Calm, plain-language civic notice for municipal modules awaiting official LGU authorization. */
export default function AuthorityPendingSurface({ title, description, missing, treatment }: Props) {
    const cleanText = (value: string) =>
        value
            .replace(/\b(?:ANN|PROC|PROJ|WF|KPI|P06|G1|R[0-9])[-0-9A-Za-z]*\b/g, 'municipal')
            .replace(/canonical active product surface/gi, 'active municipal portal')
            .replace(/de-exposed/gi, 'currently paused')
            .replace(/\s{2,}/g, ' ')
            .trim();

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
            <PageHeader
                eyebrow="Module availability"
                title={title}
                subtitle={cleanText(description)}
                actions={
                    <Link href="/dashboard" className="municipal-secondary-button">
                        <ArrowLeft size={16} aria-hidden="true" />
                        <span>Back to Dashboard</span>
                    </Link>
                }
            />

            <section
                role="note"
                aria-label={`${title} availability notice`}
                className="tcds-card border-l-4 border-l-[var(--accent-gold)] p-5 sm:p-6"
            >
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-gold-soft)] text-[var(--accent-gold-ink)]">
                        <Info size={20} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 space-y-3">
                        <h2 className="text-base font-bold text-[var(--ink-primary)]">
                            {title} is awaiting municipal office approval
                        </h2>
                        <p className="text-sm leading-6 text-[var(--ink-secondary)]">
                            {cleanText(treatment)}
                        </p>
                        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5 text-sm text-[var(--ink-secondary)]">
                            <span className="font-semibold text-[var(--ink-primary)]">Pending confirmation: </span>
                            {cleanText(missing)}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
