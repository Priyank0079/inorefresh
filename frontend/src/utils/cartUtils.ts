export const parseWeight = (pack: string): number => {
    if (!pack) return 0;
    const lowerPack = pack.toLowerCase().trim();

    // Handle ranges like "1-2 kg"
    const rangeMatch = lowerPack.match(/^([\d.]+)-([\d.]+)\s*(kg|g|gm|gsm)$/);
    if (rangeMatch) {
        const val = parseFloat(rangeMatch[1]);
        const unit = rangeMatch[3];
        return unit === 'kg' ? val : val / 1000;
    }

    // Handle simple "1kg" or "500g"
    const simpleMatch = lowerPack.match(/^([\d.]+)\s*(kg|g|gm|gsm)$/);
    if (simpleMatch) {
        const val = parseFloat(simpleMatch[1]);
        const unit = simpleMatch[2];
        return unit === 'kg' ? val : val / 1000;
    }

    // Handle "500g-1kg"
    const mixedRangeMatch = lowerPack.match(/^([\d.]+)(g|gm|gsm)-([\d.]+)(kg)$/);
    if (mixedRangeMatch) {
        const val = parseFloat(mixedRangeMatch[1]);
        return val / 1000;
    }

    // Fallback for just "1" or "2" - assume kg for fish if no unit
    const justNumMatch = lowerPack.match(/^([\d.]+)$/);
    if (justNumMatch) {
        return parseFloat(justNumMatch[1]);
    }

    return 0;
};

export const getTotalCartWeight = (items: any[]): number => {
    return items.reduce((sum, item) => {
        if (!item?.product) return sum;
        const weightPerUnit = parseWeight(item.product.pack || '');
        return sum + (weightPerUnit * (item.quantity || 0));
    }, 0);
};
