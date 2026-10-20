import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { resolveOfficeLogo } from '../../lib/office-logo-map';

type OfficeLogoProps = {
    officeCode?: string | null;
    directoryKey?: string;
    officeName: string;
    size?: 'sm' | 'md' | 'lg';
};

export default function OfficeLogo({ officeCode, directoryKey, officeName, size = 'md' }: OfficeLogoProps) {
    const logo = resolveOfficeLogo(officeCode, undefined, directoryKey);
    // A different resolved source gets a fresh image/error lifecycle.
    return <LogoImage key={logo?.src ?? 'fallback'} src={logo?.src} officeName={officeName} size={size} />;
}

function LogoImage({ src, officeName, size }: { src?: string; officeName: string; size: 'sm' | 'md' | 'lg' }) {
    const [failed, setFailed] = useState(false);
    const pixels = { sm: 36, md: 48, lg: 64 }[size];
    return <span className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"
        style={{ width: pixels, height: pixels }}>
        {src && !failed
            ? <img src={src} alt={`${officeName} logo`} width={pixels} height={pixels}
                className="h-full w-full object-contain p-1" decoding="async" onError={() => setFailed(true)} />
            : <span role="img" aria-label={`${officeName}: logo unavailable`} className="inline-flex">
                <Building2 size={Math.round(pixels / 2)} aria-hidden="true" />
            </span>}
    </span>;
}
