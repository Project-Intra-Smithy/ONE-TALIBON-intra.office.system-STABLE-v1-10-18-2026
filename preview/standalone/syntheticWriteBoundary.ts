/** Isolated visual evaluation is read-only. Never convert preview submissions into navigation successes. */
export function blockSyntheticFormSubmission(event: {
    preventDefault(): void;
    stopPropagation(): void;
}): void {
    event.preventDefault();
    event.stopPropagation();
}
