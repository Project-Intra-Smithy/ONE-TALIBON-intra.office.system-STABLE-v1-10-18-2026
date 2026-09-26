type Metrics = {
    total: number;
    inForce: number;
    underReview: number;
    milestonesThisYear: number;
};

export default function PlanMetricGrid({ metrics }: { metrics: Metrics }) {
    return (
        <dl aria-label="Planning register summary" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--municipal-muted)]">
            {[
                ['In force or adopted', metrics.inForce],
                ['Under review or updating', metrics.underReview],
                ['Milestones in 2026', metrics.milestonesThisYear],
            ].map(([label, value]) => <div key={label} className="flex gap-2"><dt>{label}</dt><dd className="font-semibold text-[var(--municipal-text)]">{value}</dd></div>)}
        </dl>
    );
}
