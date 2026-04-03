
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
  "parl",
  "pomfret",
  "crab",
  "seafood",
  "bhetki",
  "vetki",
  "rui",
  "mirgal",
  "ayre",
  "pabda",
  "tengra",
  "snapper",
  "surmai",
  "kingfish",
  "vanjaram",
  "seer",
  "mackerel",
  "bangda",
  "pomphret",
  "hilsa",
  "boal",
  "chital",
  "shol",
  "magur",
  "singi",
  "kajuli",
  "batasi",
  "mourola",
  "puti",
  "putti",
  "koi",
  "rupchanda",
  "tilapia",
  "squid",
  "octopus",
  "calamari",
  "mussel",
  "oyster",
  "clams",
  "anchovy",
  "sardine",
  "tuna",
  "salmon",
  "trout",
  "cod",
  "bass",
  "perch",
  "grouper",
  "mullet",
  "basa",
  "pangus",
  "catfish",
  "barracuda",
  "carp",
  "aar",
  "maral",
  "gajal"
];

const isFishProduct = (product: any): boolean => {
  const name = (product.productName || product.name || "").toLowerCase();
  const description = (product.description || product.smallDescription || "").toLowerCase();
  const tagsText = Array.isArray(product.tags) ? product.tags.join(" ").toLowerCase() : "";
  const haystack = `${name} ${description} ${tagsText}`;

  return fishKeywords.some((keyword) => haystack.includes(keyword));
};

const getDeterministicFishPrice = (product: any): number | null => {
  if (!isFishProduct(product)) return null;

  const key = String(
    product._id || product.id || product.product_tag || product.productName || product.name || ""
  ).trim();

  if (!key) return 200;

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i)) % 9973;
  }

  return hash % 2 === 0 ? 200 : 300;
};

export const calculateItemPrice = (product: any, variationValue: any) => {
    let selectedVariation;
    if (variationValue && product.variations) {
        selectedVariation = product.variations.find((v: any) =>
            (v._id && v._id.toString() === variationValue.toString()) ||
            v.value === variationValue ||
            v.title === variationValue ||
            v.pack === variationValue ||
            v.id === variationValue
        );
    }
    
    // Fallback to first variation if no match but variations exist
    if (!selectedVariation && product.variations && product.variations.length > 0 && !variationValue) {
        selectedVariation = product.variations[0];
    }

    let itemPrice = (selectedVariation?.discPrice && selectedVariation.discPrice > 0)
        ? selectedVariation.discPrice
        : (product.discPrice && product.discPrice > 0)
            ? product.discPrice
            : (selectedVariation?.price || product.price || 0);

    // Fallback for fish products if price is 0
    if (itemPrice === 0) {
        const fishFallback = getDeterministicFishPrice(product);
        if (fishFallback !== null) {
            itemPrice = fishFallback;
        }
    }

    return itemPrice;
};
