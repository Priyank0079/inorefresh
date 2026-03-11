const safeLower = (value: any): string => {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value).toLowerCase();
    }
    if (value && typeof value === 'object') {
        if ((value as any).name) return String((value as any).name).toLowerCase();
        if ((value as any).categoryName) return String((value as any).categoryName).toLowerCase();
        if ((value as any).subcategoryName) return String((value as any).subcategoryName).toLowerCase();
    }
    return '';
};

export const parseWeight = (pack: string, productName?: any, categoryName?: any): number => {
    if (!pack) {
        // Default to 1kg for fish products if no pack info
        if (productName || categoryName) {
            const name = safeLower(productName);
            const cat = safeLower(categoryName);
            const fishKeywords = ['fish', 'machi', 'mach', 'ilis', 'rohu', 'katla', 'prawn', 'shrimp', 'marin', 'aqua', 'bengali'];
            if (fishKeywords.some(kw => name.includes(kw) || cat.includes(kw))) {
                return 1;
            }
        }
        return 0;
    }

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

    // Fallback for just "1" or "2" - assume kg
    const justNumMatch = lowerPack.match(/^([\d.]+)$/);
    if (justNumMatch) {
        const val = parseFloat(justNumMatch[1]);
        return val > 0 ? val : 1; // Return 1 if it's 0.0 or something invalid
    }

    // Final fallback: if it's a fish product but we couldn't parse the pack, return 1
    if (productName || categoryName) {
        const name = safeLower(productName);
        const cat = safeLower(categoryName);
        const fishKeywords = ['fish', 'machi', 'mach', 'ilis', 'rohu', 'katla', 'prawn', 'shrimp', 'marin', 'aqua', 'bengali'];
        if (fishKeywords.some(kw => name.includes(kw) || cat.includes(kw))) {
            return 1;
        }
    }

    return 0;
};

export const getTotalCartWeight = (items: any[]): number => {
    return items.reduce((sum, item) => {
        if (!item?.product) return sum;
        const weightPerUnit = parseWeight(
            item.product.pack || '',
            item.product.name || item.product.productName,
            item.product.category || item.product.categoryId
        );
        return sum + (weightPerUnit * (item.quantity || 0));
    }, 0);
};
