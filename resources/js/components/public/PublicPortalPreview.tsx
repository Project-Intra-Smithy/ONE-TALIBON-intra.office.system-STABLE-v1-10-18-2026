import { ArrowLeftRight, BellRing, BriefcaseBusiness, CalendarDays, CloudSun, FileText, Files, UsersRound } from 'lucide-react';
import type { PreviewModuleItem, PreviewModuleKind, PublicContent } from './types';

const moduleIcons: Record<PreviewModuleKind, typeof FileText> = {
    memorandum: FileText,
    schedule: CalendarDays,
    notification: BellRing,
    weather: CloudSun,
};

const quickAccessIcons = [ArrowLeftRight, Files, CalendarDays, BellRing, UsersRound, BriefcaseBusiness] as const;

function PreviewModule({ module }: { module: PreviewModuleItem }) {
    const Icon = moduleIcons[module.kind];

    return <article className="min-w-0 rounded-lg border p-3.5 [border-color:var(--public-divider)] [background:var(--public-surface)]">
        <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md [background:var(--public-surface-soft)] [color:var(--public-link)]">
                <Icon size={17} aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <h3 className="text-[13px] font-bold leading-5 [color:var(--public-text)]">{module.title}</h3>
                <p className="mt-1 text-[11px] leading-4 [color:var(--public-muted)]">{module.description}</p>
            </div>
        </div>
    </article>;
}

export default function PublicPortalPreview({ content }: { content: PublicContent }) {
    return <div className="relative min-w-0 p-5 sm:p-7 lg:p-8">
        <div className="overflow-hidden rounded-xl border shadow-[0_18px_48px_rgba(5,37,24,0.24)] [border-color:rgba(255,255,255,0.24)] [background:var(--public-surface)]">
            <header className="flex items-center justify-between gap-3 border-b px-4 py-3 [border-color:var(--public-divider)] [background:var(--public-surface-soft)]">
                <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.13em] [color:var(--public-link)]">ONE TALIBON</div>
                    <div className="mt-0.5 text-xs font-semibold [color:var(--public-text)]">{content.portalPreview.eyebrow}</div>
                </div>
                <span className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] [border-color:var(--public-divider)] [color:var(--public-muted)]">Portal</span>
            </header>

            <div className="p-4 sm:p-5">
                <div className="mb-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] [color:var(--public-muted)]">Workspace preview</div>
                    <h2 className="mt-1 text-lg font-extrabold tracking-[-0.02em] [color:var(--public-text)]">{content.portalPreview.title}</h2>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {content.portalPreview.modules.map((module, index) => <div key={module.id} className={index === 0 ? 'sm:col-span-2' : ''}>
                        <PreviewModule module={module} />
                    </div>)}
                </div>

                <div className="mt-4 border-t pt-4 [border-color:var(--public-divider)]">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] [color:var(--public-muted)]">Quick access</div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {content.portalPreview.quickAccess.map((label, index) => {
                            const Icon = quickAccessIcons[index] ?? Files;
                            return <div key={label} className="flex min-h-10 items-center gap-2 rounded-md border px-2.5 py-2 [border-color:var(--public-divider)] [color:var(--public-text)]">
                                <Icon size={14} className="shrink-0 [color:var(--public-link)]" aria-hidden="true" />
                                <span className="truncate text-[10px] font-semibold">{label}</span>
                            </div>;
                        })}
                    </div>
                </div>
            </div>
        </div>
    </div>;
}
