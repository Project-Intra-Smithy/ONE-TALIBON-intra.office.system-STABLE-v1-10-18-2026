import { Head } from '@inertiajs/react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppearanceControl from '../../components/AppearanceControl';
import MunicipalBrand from '../../components/MunicipalBrand';
import WorkspaceDialog from '../../components/showcase/WorkspaceDialog';
import type { ShowcaseEntryData } from '../../components/showcase/types';
import { saveAppearance } from '../../theme/appearance';

type Props = {
    showcase: ShowcaseEntryData;
};

export default function Login({ showcase }: Props) {
    const [selectorOpen, setSelectorOpen] = useState(false);

    useEffect(() => {
        if (showcase.enabled) saveAppearance('light');
    }, [showcase.enabled]);

    return (
        <>
            <Head title="Talibon Intra-Office Portal — Secure Access" />
            <main className="min-h-screen bg-[#f7f5ed] text-[#163027] dark:bg-[#0f1a15] dark:text-[#edf5f0]">
                <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(460px,0.92fr)]">
                    <section className="relative overflow-hidden bg-[#0b442d] px-6 py-7 text-white sm:px-10 sm:py-9 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-14 lg:py-12 xl:px-20">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(210,173,69,0.14),transparent_30%),linear-gradient(145deg,rgba(255,255,255,0.03),transparent_48%)]" aria-hidden="true" />

                        <div className="relative">
                            <MunicipalBrand inverse />
                        </div>

                        <div className="relative my-14 max-w-2xl lg:my-20">
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#d2ad45]">ONE TALIBON</p>
                            <h1 className="mt-3 max-w-xl text-4xl font-extrabold leading-[1.03] tracking-[-0.035em] sm:text-5xl xl:text-6xl">
                                Municipal work starts here.
                            </h1>
                            <p className="mt-5 max-w-xl text-sm leading-6 text-white/78 sm:text-base sm:leading-7">
                                Enter the Talibon Intra-Office Portal to continue official work, coordination, records, schedules, projects, and office operations.
                            </p>

                            <div className="mt-7 grid gap-3 text-sm text-white/80 sm:grid-cols-2">
                                <div className="flex items-center gap-2.5">
                                    <ShieldCheck size={17} className="shrink-0 text-[#d2ad45]" aria-hidden="true" />
                                    <span>Authorized municipal personnel</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <LockKeyhole size={17} className="shrink-0 text-[#d2ad45]" aria-hidden="true" />
                                    <span>Protected internal workspace</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative border-t border-white/15 pt-5 text-xs text-white/58">
                            Municipality of Talibon, Bohol · Talibon Intra-Office Portal
                        </div>
                    </section>

                    <section className="flex min-h-[560px] flex-col px-5 py-5 sm:px-8 sm:py-7 lg:min-h-screen lg:px-12 lg:py-10 xl:px-16">
                        {!showcase.enabled && (
                            <div className="flex justify-end">
                                <div className="w-[210px] max-w-full">
                                    <AppearanceControl publicSurface />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-1 items-center justify-center py-10 lg:py-12">
                            <div className="w-full max-w-[520px] rounded-2xl border border-[#d6e1da] bg-white p-6 shadow-[0_18px_48px_rgba(11,68,45,0.08)] sm:p-7 dark:border-[#30473a] dark:bg-[#15251d] dark:shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#12613f] dark:text-[#8fc9a7]">Secure access</p>
                                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.025em] text-[#163027] dark:text-[#edf5f0]">Enter the Talibon Intra-Office Portal</h2>
                                <p className="mt-3 text-sm leading-6 text-[#64736c] dark:text-[#adbbb3]">
                                    Choose the authorized municipal role and office context needed for this session.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => setSelectorOpen(true)}
                                    disabled={!showcase.enabled || showcase.personas.length === 0}
                                    className="mt-7 flex min-h-12 w-full items-center justify-between rounded-lg bg-[#12613f] px-4 py-3 text-sm font-semibold text-white transition-[background-color,transform,box-shadow] duration-150 hover:-translate-y-px hover:bg-[#0b442d] hover:shadow-[0_8px_20px_rgba(18,97,63,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#94a39b] disabled:shadow-none dark:focus-visible:ring-[#d2ad45] dark:focus-visible:ring-offset-[#15251d]"
                                >
                                    <span>{showcase.enabled ? 'Open Municipal Workspace' : 'Workspace unavailable'}</span>
                                    {showcase.enabled && <ArrowRight size={18} aria-hidden="true" />}
                                </button>

                                <div className="mt-5 border-t border-[#e1e8e3] pt-4 text-xs leading-5 text-[#64736c] dark:border-[#30473a] dark:text-[#adbbb3]">
                                    Access is limited to authorized municipal personnel and approved workspace contexts.
                                </div>
                            </div>
                        </div>

                        <footer className="border-t border-[#d6e1da] py-4 text-xs text-[#64736c] dark:border-[#30473a] dark:text-[#adbbb3]">
                            Talibon Intra-Office Portal · Municipality of Talibon, Bohol
                        </footer>
                    </section>
                </div>
            </main>

            <WorkspaceDialog
                open={selectorOpen}
                personas={showcase.personas}
                onClose={() => setSelectorOpen(false)}
            />
        </>
    );
}
