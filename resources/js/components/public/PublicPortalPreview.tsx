import { ArrowLeftRight, ArrowUpRight, BellRing, BriefcaseBusiness, CalendarDays, CloudSun, FileText, Files, UsersRound } from 'lucide-react';
import type { PreviewModuleItem, PreviewModuleKind, PublicContent, PublicInfoSelection } from './types';

const moduleIcons: Record<PreviewModuleKind, typeof FileText> = {
    memorandum: FileText,
    schedule: CalendarDays,
    notification: BellRing,
    weather: CloudSun,
};

const quickAccessIcons = [ArrowLeftRight, Files, CalendarDays, BellRing, UsersRound, BriefcaseBusiness] as const;

type OpenInfo = (item: PublicInfoSelection, trigger: HTMLElement) => void;

function PreviewModule({ module, detailSource, onOpenInfo }: { module: PreviewModuleItem; detailSource?: PreviewModuleItem; onOpenInfo: OpenInfo }) {
    const Icon = moduleIcons[module.kind];
    const interactive = Boolean(detailSource?.detail);

    const content = <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md [background:var(--public-surface-soft)] [color:var(--public-link)]">
            <Icon size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-[12px] font-bold leading-[1.4] [color:var(--public-text)]">{module.title}</h3>
                {interactive && <ArrowUpRight size={13} className="mt-0.5 shrink-0 [color:var(--public-muted)]" aria-hidden="true" />}
            </div>
            <p className="mt-0.5 text-[10px] leading-4 [color:var(--public-muted)]">{module.description}</p>
        </div>
    </div>;

    if (!interactive || !detailSource?.detail) {
        return <article className="min-w-0 rounded-lg border p-3 [border-color:var(--public-divider)] [background:var(--public-surface)]">{content}</article>;
    }

    return <button
        type="button"
        aria-haspopup="dialog"
        onClick={event => onOpenInfo({
            eyebrow: 'Everyday Coordination',
            title: detailSource.title,
            description: detailSource.description,
            detail: detailSource.detail!,
        }, event.currentTarget)}
        className="public-interactive-card min-w-0 rounded-lg border p-3 text-left [border-color:var(--public-divider)] [background:var(--public-surface)]"
    >
        {content}
    </button>;
}

export default function PublicPortalPreview({ content, onOpenInfo }: { content: PublicContent; onOpenInfo: OpenInfo }) {
    return <div className="relative min-w-0 p-4 sm:p-5 lg:p-6">
        <div className="overflow-hidden rounded-xl border shadow-[0_14px_36px_rgba(5,37,24,0.2)] [border-color:rgba(255,255,255,0.24)] [background:var(--public-surface)]">
            <header className="flex items-center justify-between gap-3 border-b px-3.5 py-2.5 [border-color:var(--public-divider)] [background:var(--public-surface-soft)]">
                <div>
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.12em] [color:var(--public-link)]">ONE TALIBON</div>
                    <div className="text-[11px] font-semibold [color:var(--public-text)]">{content.portalPreview.eyebrow}</div>
                </div>
                <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] [border-color:var(--public-divider)] [color:var(--public-muted)]">Portal</span>
            </header>

            <div className="p-3.5 sm:p-4">
                <div className="mb-3">
                    <div className="text-[9px] font-bold uppercase tracking-[0.11em] [color:var(--public-muted)]">Workspace preview</div>
                    <h2 className="mt-0.5 text-base font-extrabold tracking-[-0.02em] [color:var(--public-text)]">{content.portalPreview.title}</h2>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {content.portalPreview.modules.map((module, index) => {
                        const detailSource = content.dailyConvenience.items.find(item => item.kind === module.kind);
                        return <div key={module.id} className={index === 0 ? 'sm:col-span-2' : ''}>
                            <PreviewModule module={module} detailSource={detailSource} onOpenInfo={onOpenInfo} />
                        </div>;
                    })}
                </div>

                <div className="mt-3 border-t pt-3 [border-color:var(--public-divider)]">
                    <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.11em] [color:var(--public-muted)]">Quick access</div>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {content.portalPreview.quickAccess.map((item, index) => {
                            const Icon = quickAccessIcons[index] ?? Files;
                            const capability = content.capabilities.items.find(candidate => candidate.id === item.capabilityId);
                            return <button
                                key={item.capabilityId}
                                type="button"
                                aria-haspopup="dialog"
                                disabled={!capability}
                                onClick={event => capability && onOpenInfo({
                                    eyebrow: 'Portal Capability',
                                    title: capability.title,
                                    description: capability.description,
                                    detail: capability.detail,
                                }, event.currentTarget)}
                                className="public-interactive-card flex min-h-9 items-center gap-2 rounded-md border px-2 py-1.5 text-left disabled:cursor-default disabled:opacity-60 [border-color:var(--public-divider)] [color:var(--public-text)]"
                            >
                                <Icon size={13} className="shrink-0 [color:var(--public-link)]" aria-hidden="true" />
                                <span className="min-w-0 flex-1 truncate text-[9px] font-semibold">{item.label}</span>
                                <ArrowUpRight size={11} className="shrink-0 [color:var(--public-muted)]" aria-hidden="true" />
                            </button>;
                        })}
                    </div>
                </div>
            </div>
        </div>
    </div>;
}
