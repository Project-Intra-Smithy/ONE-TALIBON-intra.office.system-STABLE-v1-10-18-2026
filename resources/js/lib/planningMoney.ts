export function planningAmount(value: string | null | undefined): string {
    if (value == null || value === '') return 'Not supplied';
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return 'Invalid amount';
    const [whole, fraction = ''] = value.split('.');
    return `₱${BigInt(whole).toLocaleString('en-PH')}.${fraction.padEnd(2, '0')}`;
}

export function planningTotal(values: string[]): string {
    if (values.every(value => value === '')) return 'Not supplied';
    let cents = 0n;
    for (const value of values) {
        if (value === '') continue;
        if (!/^\d{1,13}(?:\.\d{1,2})?$/.test(value)) return 'Invalid amount';
        const [whole, fraction = ''] = value.split('.');
        cents += BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
    }
    return planningAmount(`${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`);
}
