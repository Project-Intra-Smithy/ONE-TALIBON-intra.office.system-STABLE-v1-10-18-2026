import { ArrowRight, type LucideIcon } from 'lucide-react';

type Props = {
    label: string;
    description: string;
    context?: string;
    icon: LucideIcon;
    onClick: () => void;
    disabled?: boolean;
};

export default function PersonaCard({ label, description, context, icon: Icon, onClick, disabled = false }: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="group flex min-h-20 w-full items-center gap-4 rounded-xl border border-[#d6e1da] bg-white px-4 py-3 text-left transition-[border-color,background-color,transform,box-shadow] duration-150 hover:-translate-y-px hover:border-[#bdcec3] hover:bg-[#f0f5f1] hover:shadow-[0_8px_22px_rgba(11,68,45,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19754b] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 dark:border-[#30473a] dark:bg-[#15251d] dark:hover:border-[#496354] dark:hover:bg-[#1b2e24] dark:hover:shadow-[0_8px_22px_rgba(0,0,0,0.16)] dark:focus-visible:ring-[#d2ad45] dark:focus-visible:ring-offset-[#0f1a15]"
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e9f2ec] text-[#12613f] dark:bg-[#1b2e24] dark:text-[#8fc9a7]">
                <Icon size={19} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#163027] dark:text-[#edf5f0]">{label}</span>
                <span className="mt-0.5 block text-sm leading-5 text-[#64736c] dark:text-[#adbbb3]">{description}</span>
                {context && <span className="mt-1 block text-xs font-medium text-[#12613f] dark:text-[#8fc9a7]">{context}</span>}
            </span>
            <ArrowRight size={17} className="shrink-0 text-[#7d8c84] transition-transform group-hover:translate-x-0.5 dark:text-[#829188]" aria-hidden="true" />
        </button>
    );
}
