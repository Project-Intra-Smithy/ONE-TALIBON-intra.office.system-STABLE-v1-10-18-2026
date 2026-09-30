export type CBMSArea = {
    reference: string;
    label: string;
    areaContext: string;
    householdsAggregate: number;
    indicators: {
        employment: number;
        schoolParticipation: number;
        basicWaterAccess: number;
        livelihoodStability: number;
    };
    spatialContext: {
        settlementPattern: string;
        serviceAccess: string;
        planningBand: string;
    };
    insights: string[];
};

export const cbmsAreas: CBMSArea[] = [
    {
        reference: 'CBMS-A01',
        label: 'Barangay Cluster A reference',
        areaContext: 'Compact urban-service context',
        householdsAggregate: 1240,
        indicators: { employment: 74, schoolParticipation: 91, basicWaterAccess: 95, livelihoodStability: 69 },
        spatialContext: { settlementPattern: 'Compact mixed residential pattern', serviceAccess: 'High relative service proximity reference', planningBand: 'Urban service coordination' },
        insights: ['Employment reference is comparatively strong.', 'Livelihood stability remains the main planning comparison gap.', 'Service access context is represented as relatively concentrated.'],
    },
    {
        reference: 'CBMS-A02',
        label: 'Barangay Cluster B reference',
        areaContext: 'Peri-urban growth context',
        householdsAggregate: 890,
        indicators: { employment: 68, schoolParticipation: 88, basicWaterAccess: 86, livelihoodStability: 61 },
        spatialContext: { settlementPattern: 'Expanding edge-settlement pattern', serviceAccess: 'Moderate service proximity reference', planningBand: 'Growth-area service access' },
        insights: ['Water-access reference trails the urban cluster.', 'Livelihood stability may merit comparative planning attention.', 'Growth context suggests monitoring service reach as settlement expands.'],
    },
    {
        reference: 'CBMS-A03',
        label: 'Barangay Cluster C reference',
        areaContext: 'Dispersed residential context',
        householdsAggregate: 640,
        indicators: { employment: 63, schoolParticipation: 84, basicWaterAccess: 79, livelihoodStability: 58 },
        spatialContext: { settlementPattern: 'Dispersed residential pattern', serviceAccess: 'Lower relative service proximity reference', planningBand: 'Distributed service planning' },
        insights: ['School participation remains relatively high compared with livelihood stability.', 'Water-access reference is the lowest among illustrative clusters.', 'Dispersed pattern suggests location-aware service planning.'],
    },
    {
        reference: 'CBMS-A04',
        label: 'Barangay Cluster D reference',
        areaContext: 'Mixed civic-residential context',
        householdsAggregate: 1015,
        indicators: { employment: 71, schoolParticipation: 90, basicWaterAccess: 92, livelihoodStability: 66 },
        spatialContext: { settlementPattern: 'Mixed civic and residential pattern', serviceAccess: 'High-to-moderate service proximity reference', planningBand: 'Civic-service coordination' },
        insights: ['Education and water references are comparatively strong.', 'Livelihood stability remains below other service indicators.', 'Civic-service proximity offers a useful comparison baseline.'],
    },
];

export const cbmsIndicatorLabels = {
    employment: 'Employment reference',
    schoolParticipation: 'School participation',
    basicWaterAccess: 'Basic water access',
    livelihoodStability: 'Livelihood stability',
} as const;
