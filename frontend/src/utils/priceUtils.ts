import { Product } from '../types/domain';

export interface CalculatedPrice {
  displayPrice: number;
  mrp: number;
  discount: number;
  hasDiscount: boolean;
}

const fishKeywords = [
  "fish",
  "machi",
  "mach",
  "ilis",
  "rohu",
  "katla",
  "prawn",
  "shrimp",
  "lobster",
  "sea",
  "marine",
  "marin",
  "aqua",
  "bengali",
  "bangali",
  "bengoli",
  "river",
  "ocean",
  "freshwater",
  "traditional",
];

const normalizeText = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[_-]/g, " ");

const isFishProduct = (product: any): boolean => {
  const rawCategory = product?.category;
  const rawCategoryText =
    typeof rawCategory === "string"
      ? rawCategory
      : `${rawCategory?.name || ""} ${rawCategory?.slug || ""}`;
  const categoryDataText = `${product?.categoryData?.name || ""} ${product?.categoryData?.slug || ""}`;
  const tagsText = Array.isArray(product?.tags) ? product.tags.join(" ") : "";
  const haystack = normalizeText(
    `${product?.name || ""} ${product?.productName || ""} ${rawCategoryText} ${product?.categoryId || ""} ${categoryDataText} ${tagsText}`
  );

  return fishKeywords.some((keyword) => haystack.includes(keyword));
};

const getDeterministicFishPrice = (product: any): number | null => {
  if (!isFishProduct(product)) return null;

  const key = String(
    product?._id || product?.id || product?.product_tag || product?.productName || product?.name || ""
  ).trim();

  if (!key) return 200;

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i)) % 9973;
  }

  return hash % 2 === 0 ? 200 : 300;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const firstPositive = (...values: unknown[]): number => {
  for (const value of values) {
    const n = toNumber(value);
    if (n > 0) return n;
  }
  return 0;
};

export const calculateProductPrice = (product: any, variationSelector?: number | string): CalculatedPrice => {
  if (!product) {
    return {
      displayPrice: 0,
      mrp: 0,
      discount: 0,
      hasDiscount: false
    };
  }

  let variation;
  if (typeof variationSelector === 'number') {
    variation = product.variations?.[variationSelector];
  } else if (typeof variationSelector === 'string') {
    variation = product.variations?.find((v: any) => (v._id === variationSelector || v.id === variationSelector));
  }

  // Fallback to first variation if no specific one selected/found but variations exist
  // Only if variationSelector was NOT provided (undefined). If it was provided but not found, we probably shouldn't default to 0?
  // Current behavior was: if index undefined, use index 0.
  if (!variation && product.variations?.length > 0 && variationSelector === undefined) {
    variation = product.variations[0];
  }

  const fishFixedPrice = getDeterministicFishPrice(product);
  if (fishFixedPrice !== null) {
    return {
      displayPrice: fishFixedPrice,
      mrp: fishFixedPrice,
      discount: 0,
      hasDiscount: false,
    };
  }

  const firstVariation = product.variations?.[0];

  const displayPrice = firstPositive(
    variation?.discPrice,
    variation?.salePrice,
    product.discPrice,
    product.salePrice,
    variation?.price,
    product.price,
    firstVariation?.discPrice,
    firstVariation?.salePrice,
    firstVariation?.price,
    product.mrp,
    product.compareAtPrice
  );

  const mrp = firstPositive(
    variation?.price,
    variation?.mrp,
    product.mrp,
    product.compareAtPrice,
    product.price,
    firstVariation?.price,
    displayPrice
  );

  const hasDiscount = displayPrice > 0 && mrp > displayPrice;
  const discount = hasDiscount ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  return {
    displayPrice,
    mrp,
    discount,
    hasDiscount
  };
};

export default calculateProductPrice;
