export type VerifiedOfficeLogo = Readonly<{
    src: `/logos/${string}`;
    identityEvidence: string;
    usageApproval: string;
    directoryKey?: string;
}>;

// AJ authorized frontend integration on 2026-10-20; official LGU branding approval
// remains pending. These exact identifiers confer no routing or access rights.
const usageApproval = 'AJ frontend integration authorization, 2026-10-20; issue #39 comment 6292080432';
export const officeLogoMap: Readonly<Record<string, VerifiedOfficeLogo>> = Object.freeze({
    MPDO: { src: '/logos/MPDO.png', directoryKey: 'FOCAL-001', identityEvidence: 'Talibon Municipal Planning and Development Office', usageApproval },
    ACCOUNTING: { src: '/logos/MAccO.png', directoryKey: 'FOCAL-009', identityEvidence: 'Talibon Municipal Accounting Office; excludes Internal Auditing Unit', usageApproval },
    TREASURY: { src: '/logos/MTO.png', directoryKey: 'FOCAL-010', identityEvidence: 'Talibon Municipal Treasury Office; not Tourism', usageApproval },
    MSWDO: { src: '/logos/MSWDO.jpg', directoryKey: 'FOCAL-016', identityEvidence: 'Municipal Social Welfare and Development Office, LGU-Talibon', usageApproval },
    AGRI: { src: '/logos/MAO.jpg', directoryKey: 'FOCAL-018', identityEvidence: 'Office of the Municipal Agriculturist, Municipality of Talibon', usageApproval },
    PESO: { src: '/logos/MPESO.jpg', directoryKey: 'FOCAL-022', identityEvidence: 'Municipal Public Employment Service Office, Talibon', usageApproval },
    LEDIPO: { src: '/logos/MEDIPO.png', directoryKey: 'FOCAL-024', identityEvidence: 'Talibon Economic Development and Investment Promotions; Municipal/Local naming variant', usageApproval },
    MARKET: { src: '/logos/MMAO.png', directoryKey: 'FOCAL-035', identityEvidence: 'Talibon Municipal Market Administration; Market Supervisor catalog entry, not ADMIN', usageApproval },
    'FOCAL-036': { src: '/logos/MO-TTMO (1).png', directoryKey: 'FOCAL-036', identityEvidence: 'Talibon Traffic Management Unit / Traffic and Management Office; not TITT TRANSPORT', usageApproval },
});

export function resolveOfficeLogo(
    officeCode: string | null | undefined,
    mappings: Readonly<Record<string, VerifiedOfficeLogo>> = officeLogoMap,
    directoryKey?: string,
): VerifiedOfficeLogo | null {
    // Catalog identity remains usable when the backend has no operational Department.
    // A supplied code/key disagreement stays neutral rather than guessing an alias.
    const logo = officeCode
        ? (Object.hasOwn(mappings, officeCode) ? mappings[officeCode] : null)
        : (directoryKey ? Object.values(mappings).find(value => value.directoryKey === directoryKey) : null);
    if (!logo || (directoryKey && logo.directoryKey !== directoryKey)) return null;
    return logo.identityEvidence.trim() && logo.usageApproval.trim() ? logo : null;
}
