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

const FISH_KEYWORDS = [
    'fish', 'machi', 'mach', 'ilis', 'rohu', 'katla', 'prawn', 'shrimp', 
    'lobster', 'sea', 'marine', 'marin', 'aqua', 'bengali', 'bangali', 'river', 
    'ocean', 'freshwater', 'ayre', 'pabda', 'tengra', 'rui', 'mirgal',
    'parl', 'pomfret', 'crab', 'seafood', 'bhetki', 'vetki',
    'snapper', 'surmai', 'kingfish', 'vanjaram', 'seer', 'mackerel',
    'bangda', 'pomphret', 'hilsa', 'boal', 'chital', 'shol', 'magur',
    'singi', 'kajuli', 'batasi', 'mourola', 'puti', 'putti', 'koi',
    'rupchanda', 'tilapia', 'squid', 'octopus', 'calamari', 'mussel',
    'oyster', 'clams', 'anchovy', 'sardine', 'tuna', 'salmon', 'trout',
    'cod', 'bass', 'perch', 'grouper', 'mullet', 'basa', 'pangus', 'catfish',
    'barracuda', 'carp', 'aar', 'maral', 'gajal'
];

const isFishMatch = (name: string, cat: string): boolean => {
    const n = name.toLowerCase();
    const c = cat.toLowerCase();
    return FISH_KEYWORDS.some(kw => n.includes(kw) || c.includes(kw));
};

export const parseWeight = (pack: string, productName?: any, categoryName?: any): number => {
    const nameStr = safeLower(productName);
    const catStr = safeLower(categoryName);
    const isFish = isFishMatch(nameStr, catStr);

    if (!pack) {
        return isFish ? 1 : 0;
    }

    const lowerPack = pack.toLowerCase().trim();

    // 1. Try to match ranges like "1-2 kg" or "2 to 3 kg"
    const rangeMatch = lowerPack.match(/([\d.]+)\s*(-|to)\s*([\d.]+)\s*(kg|g|gm|gsm)/);
    if (rangeMatch) {
        const val = parseFloat(rangeMatch[1]);
        const unit = rangeMatch[4];
        return (unit === 'kg') ? val : val / 1000;
    }

    // 2. Try to match simple "1kg" or "500g" anywhere in string (e.g. "Size: 5kg up")
    const simpleMatch = lowerPack.match(/([\d.]+)\s*(kg|g|gm|gsm)/);
    if (simpleMatch) {
        const val = parseFloat(simpleMatch[1]);
        const unit = simpleMatch[2];
        return (unit === 'kg') ? val : val / 1000;
    }

    // 3. Handle "500g-1kg"
    const mixedRangeMatch = lowerPack.match(/([\d.]+)(g|gm|gsm)-([\d.]+)(kg)/);
    if (mixedRangeMatch) {
        const val = parseFloat(mixedRangeMatch[1]);
        return val / 1000;
    }

    // 4. Fallback for just "1" or "2" - assume kg
    const justNumMatch = lowerPack.match(/([\d.]+)/);
    if (justNumMatch) {
        const val = parseFloat(justNumMatch[1]);
        if (val > 0) return val;
    }

    // 5. Final fallback for fish
    return isFish ? 1 : 0;
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

