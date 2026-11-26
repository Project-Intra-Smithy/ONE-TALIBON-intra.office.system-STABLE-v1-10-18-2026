/** Keep a 48px gap between reference targets; exact coincident coordinates remain selectable in a list. */
export function groupMapPins<T>(pins: T[], point: (pin: T) => { x: number; y: number }): T[][] {
    const points = pins.map(point);
    const remaining = new Set(pins.map((_, index) => index));
    const groups: T[][] = [];
    while (remaining.size) {
        const first = remaining.values().next().value!;
        remaining.delete(first);
        const indices = [first];
        for (let cursor = 0; cursor < indices.length; cursor++) {
            const origin = points[indices[cursor]];
            for (const index of remaining) {
                if (Math.hypot(origin.x - points[index].x, origin.y - points[index].y) < 48) {
                    indices.push(index);
                    remaining.delete(index);
                }
            }
        }
        groups.push(indices.map(index => pins[index]));
    }
    return groups;
}
