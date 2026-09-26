export type SpotlightRect = {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
};

export default function TourSpotlight({ rect }: { rect: SpotlightRect | null }) {
    if (!rect) {
        return <div aria-hidden="true" className="fixed inset-0 z-[90] bg-[#071b13]/70 backdrop-blur-[1px]" />;
    }

    const gap = 6;
    const top = Math.max(0, rect.top - gap);
    const left = Math.max(0, rect.left - gap);
    const right = rect.right + gap;
    const bottom = rect.bottom + gap;
    const height = Math.max(0, bottom - top);

    return (
        <>
            <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[90] bg-[#071b13]/70 backdrop-blur-[1px]" style={{ height: top }} />
            <div aria-hidden="true" className="fixed bottom-0 left-0 z-[90] bg-[#071b13]/70 backdrop-blur-[1px]" style={{ top, width: left }} />
            <div aria-hidden="true" className="fixed bottom-0 right-0 z-[90] bg-[#071b13]/70 backdrop-blur-[1px]" style={{ top, left: right }} />
            <div aria-hidden="true" className="fixed inset-x-0 bottom-0 z-[90] bg-[#071b13]/70 backdrop-blur-[1px]" style={{ top: bottom }} />
            <div
                aria-hidden="true"
                data-onboarding="tour-spotlight"
                className="pointer-events-none fixed z-[92] rounded-lg border-2 border-[#d3ad5b] shadow-[0_0_0_3px_rgba(211,173,91,0.24)] transition-[top,left,width,height] duration-150 motion-reduce:transition-none"
                style={{ top, left, width: Math.max(rect.width + gap * 2, 1), height: Math.max(height, 1) }}
            />
        </>
    );
}
