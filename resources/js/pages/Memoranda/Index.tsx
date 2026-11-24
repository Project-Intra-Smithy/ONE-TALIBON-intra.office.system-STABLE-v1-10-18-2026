import '../../../css/aj-page-workspace.css';
import '../../../css/portal-visual-redesign.css';
import { Link } from '@inertiajs/react';
import { ArrowRight, FileText, Plus } from 'lucide-react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';
import { formatDateTimePH } from '../../lib/format';

type Memo = { id: number; memo_number: string; title: string; classification: string; requires_acknowledgement: boolean; published_at: string; recipients_count: number; issuer: { name: string }; issuing_department: { name: string; short_name?: string } };

export default function Index({ memoranda = [], authority, view = 'overview' }: { memoranda: Memo[]; authority: { canPublish: boolean }; view: string }) {
    const canPublish = authority?.canPublish === true;
    return <AppLayout title="Memoranda"><PageFrame width="standard" className="civic-page aj-page-workspace" density="comfortable">
        <PageHeader eyebrow="Central issuance" title="Memoranda" icon={FileText}
            description="Municipal memoranda delivered to the appropriate employees and offices."
            aside={canPublish && <Link href="/memoranda/create" className="municipal-action"><Plus size={17} />Publish memorandum</Link>}
        />
        <nav aria-label="Memoranda views" className="mb-4 flex flex-wrap gap-2">{(['overview', 'for_me', 'needs_acknowledgement', 'unread', 'acknowledged', ...(canPublish ? ['office_issuances'] : [])] as string[]).map((option) => <Link key={option} href={`/memoranda?view=${option}`} aria-current={view === option ? 'page' : undefined} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${view === option ? 'bg-[var(--brand-primary)] text-white' : 'border border-[var(--border-default)] bg-[var(--surface-recessed)] text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]'}`}>{option.replaceAll('_', ' ')}</Link>)}</nav>
        <div className="municipal-panel divide-y divide-[var(--border-default)] overflow-hidden">
            {memoranda.map((memo) => <Link key={memo.id} href={`/memoranda/${memo.id}`} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-[var(--surface-hover)] sm:px-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wide text-[var(--brand-ink)]">{memo.memo_number}</div>
                    <div className="mt-1 break-words text-base font-semibold text-[var(--ink-primary)]">{memo.title}</div>
                    <div className="mt-1 text-xs leading-5 text-[var(--ink-secondary)]">{memo.issuing_department?.short_name || memo.issuing_department?.name || 'Issuing office'} · {memo.published_at ? formatDateTimePH(memo.published_at) : 'Publication date unavailable'}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3 py-1 text-xs font-bold uppercase text-[var(--ink-secondary)]">{memo.classification}</span>
                    {canPublish && <span className="text-xs text-[var(--ink-secondary)]">{memo.recipients_count} recipients</span>}
                    <ArrowRight size={17} className="text-[var(--ink-secondary)]" aria-hidden="true" />
                </div>
            </Link>)}
            {memoranda.length === 0 && <div className="municipal-empty m-4 text-sm">No memoranda available.</div>}
        </div>
    </PageFrame></AppLayout>;
}
