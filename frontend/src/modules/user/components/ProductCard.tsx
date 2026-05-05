import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useRef } from 'react';
import { Product } from '../../../types/domain';
import { useCart } from '../../../context/CartContext';
import { calculateProductPrice } from '../../../utils/priceUtils';
import WishlistButton from '../../../components/WishlistButton';

interface ProductCardProps {
  product: Product;
  showBadge?: boolean;
  badgeText?: string;
  showPackBadge?: boolean;
  showStockInfo?: boolean;
  showHeartIcon?: boolean;
  showRating?: boolean;
  showVegetarianIcon?: boolean;
  showOptionsText?: boolean;
  optionsCount?: number;
  compact?: boolean;
  categoryStyle?: boolean;
}

export default function ProductCard({
  product,
  // Other props kept for compatibility but ignored for the redesign per user rules
  showBadge = false,
  badgeText = '',
  showPackBadge = false,
  showStockInfo = false,
  showRating = false,
  showVegetarianIcon = false,
  showOptionsText = false,
  optionsCount = 2,
  compact = false,
  categoryStyle = false,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity } = useCart();
  const imageRef = useRef<HTMLImageElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  // Single ref to track any cart operation in progress for this product
  const isOperationPendingRef = useRef(false);

  const cartItem = cart.items.find((item) => {
    if (!item?.product) return false;
    const itemProdId = String(item.product.id || item.product._id);
    const prodId = String((product as any).id || product._id);
    return itemProdId === prodId;
  });
  const inCartQty = cartItem?.quantity || 0;

  // Get Price and MRP using utility
  const { displayPrice, mrp, discount } = calculateProductPrice(product);
  type FishCategoryKey = 'aqua' | 'marine' | 'bengali';

  const FISH_CATEGORY_FALLBACK_IMAGES: Record<FishCategoryKey, string> = {
    aqua: '/images/aqua_fish.png',
    marine: '/images/fish/marine-fish.jpg',
    bengali: '/images/bengali_fish.png',
  };

  const getCategorySearchText = (p: Product): string => {
    const rawCategory = (p as any).category;
    const rawCategoryText =
      typeof rawCategory === 'string'
        ? rawCategory
        : `${rawCategory?.name || ''} ${rawCategory?.slug || ''}`;
    const categoryDataText = `${p.categoryData?.name || ''} ${(p.categoryData as any)?.slug || ''}`;
    return `${rawCategoryText} ${p.categoryId || ''} ${categoryDataText}`.toLowerCase();
  };

  const getFishCategoryKey = (p: Product): FishCategoryKey | null => {
    const name = (p.name || (p as any).productName || '').toLowerCase();
    const categoryText = getCategorySearchText(p);
    const haystack = `${name} ${categoryText}`;

    if (haystack.includes('aqua') || haystack.includes('freshwater') || haystack.includes('river')) {
      return 'aqua';
    }
    if (haystack.includes('marin') || haystack.includes('marine') || haystack.includes('sea') || haystack.includes('ocean')) {
      return 'marine';
    }
    if (haystack.includes('bengali') || haystack.includes('bangali') || haystack.includes('bengoli') || haystack.includes('traditional')) {
      return 'bengali';
    }
    return null;
  };

  const isFishProduct = (p: Product): boolean => {
    const name = (p.name || (p as any).productName || "").toLowerCase();
    const categoryText = getCategorySearchText(p);

    const fishKeywords = [
      'fish', 'machi', 'mach', 'ilis', 'rohu', 'katla', 'prawn', 'shrimp',
      'lobster', 'sea', 'marine', 'marin', 'aqua', 'bengali', 'bangali', 'river',
      'ocean', 'freshwater', 'ayre', 'pabda', 'tengra', 'rui', 'mirgal',
      'snapper', 'surmai', 'kingfish', 'vanjaram', 'seer', 'mackerel',
      'bangda', 'pomphret', 'hilsa', 'boal', 'chital', 'shol', 'magur',
      'singi', 'kajuli', 'batasi', 'mourola', 'puti', 'putti', 'koi',
      'rupchanda', 'tilapia', 'squid', 'octopus', 'calamari', 'mussel',
      'oyster', 'clams', 'anchovy', 'sardine', 'tuna', 'salmon', 'trout',
      'cod', 'bass', 'perch', 'grouper', 'mullet', 'basa', 'pangus', 'catfish',
      'barracuda', 'carp', 'aar', 'maral', 'gajal'
    ];

    return fishKeywords.some(kw => name.includes(kw) || categoryText.includes(kw));
  };

  const fishCategoryKey = getFishCategoryKey(product);
  const categoryImageFromApi =
    typeof (product as any).category === 'object' && (product as any).category?.image
      ? String((product as any).category.image)
      : '';
  const categoryImageFromProductData = product.categoryData?.imageUrl || '';
  const productImageSrc =
    (fishCategoryKey
      ? (categoryImageFromApi || categoryImageFromProductData || FISH_CATEGORY_FALLBACK_IMAGES[fishCategoryKey])
      : '') ||
    product.imageUrl ||
    product.mainImage;

  const isFish = isFishProduct(product);
  const isMarineCategoryImage = fishCategoryKey === 'marine';
  const resolvedDisplayPrice = Number(displayPrice) > 0
    ? Number(displayPrice)
    : Number(mrp) > 0
      ? Number(mrp)
      : null;

  const handleCardClick = () => {
    navigate(`/product/${((product as any).id || product._id) as string}`);
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Check if product is available in user's location
    if (product.isAvailable === false) {
      return;
    }

    // Prevent any operation while another is in progress
    if (isOperationPendingRef.current) {
      return;
    }

    isOperationPendingRef.current = true;

    try {
      await addToCart(product, addButtonRef.current);
    } finally {
      // Reset the flag after the operation truly completes
      isOperationPendingRef.current = false;
    }
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Prevent any operation while another is in progress
    if (isOperationPendingRef.current || inCartQty <= 0 || !cartItem) {
      return;
    }

    isOperationPendingRef.current = true;

    try {
      const variantId = (cartItem.product as any).variantId || (cartItem.product as any).selectedVariant?._id;
      const variantTitle = (cartItem.product as any).variantTitle || (cartItem.product as any).pack || (cartItem as any).variation;

      await updateQuantity(
        ((product as any).id || product._id) as string,
        inCartQty - 1,
        variantId,
        variantTitle
      );
    } finally {
      // Reset the flag after the operation truly completes
      isOperationPendingRef.current = false;
    }
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Check if product is available in user's location
    if (product.isAvailable === false) {
      return;
    }

    // Prevent any operation while another is in progress
    if (isOperationPendingRef.current) {
      return;
    }

    isOperationPendingRef.current = true;

    try {
      if (inCartQty > 0 && cartItem) {
        const variantId = (cartItem.product as any).variantId || (cartItem.product as any).selectedVariant?._id;
        const variantTitle = (cartItem.product as any).variantTitle || (cartItem.product as any).pack || (cartItem as any).variation;

        await updateQuantity(
          ((product as any).id || product._id) as string,
          inCartQty + 1,
          variantId,
          variantTitle
        );
      } else {
        await addToCart(product, addButtonRef.current);
      }
    } finally {
      // Reset the flag after the operation truly completes
      isOperationPendingRef.current = false;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.14)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={handleCardClick}
      className="relative bg-white rounded-[24px] md:rounded-[28px] flex flex-col group transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100/50"
      style={{
        boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
        fontFamily: 'Inter, Poppins, sans-serif'
      }}
    >
      {/* 2 Product Image Area - Now Full Width at Top */}
      <div className="relative w-full h-[140px] md:h-[180px] overflow-hidden bg-[#f8fafc]">
        {/* Availability Badge - Now absolute over image */}
        <div className="absolute top-[12px] left-[12px] z-20 flex flex-col gap-1.5">
          <div className="px-[8px] py-[3px] md:px-[10px] md:py-[4px] rounded-[8px] md:rounded-[10px] bg-white/90 backdrop-blur-sm text-[#2563eb] text-[10px] md:text-[11px] font-[600] uppercase tracking-wider shadow-sm border border-blue-50/50">
            {badgeText || (product.isAvailable === false ? 'Out of Range' : `${product.stock || 0} AVAILABLE`)}
          </div>
          {isFish && (
            <div className="px-[8px] py-[3px] md:px-[10px] md:py-[4px] rounded-[8px] md:rounded-[10px] bg-[#fff7ed]/90 backdrop-blur-sm text-[#ea580c] text-[10px] md:text-[11px] font-[700] uppercase tracking-wider border border-[#fdba74]/50 shadow-sm">
              🐟 MIN 5KG
            </div>
          )}
        </div>

        {/* Wishlist Button - Top Right */}
        <WishlistButton 
          productId={String((product as any).id || product._id)} 
          className="top-[12px] right-[12px] z-30"
          size="sm"
        />

        <div className="w-full h-full transition-transform duration-700 group-hover:scale-110">
          <img
            ref={imageRef}
            src={productImageSrc}
            alt={product.name || product.productName || 'Product'}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.dataset.triedFallback === 'true') {
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.fallback-icon')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-full flex items-center justify-center bg-gray-50 text-3xl font-bold text-gray-200';
                  fallback.textContent = (product.name || product.productName || '?').charAt(0).toUpperCase();
                  parent.appendChild(fallback);
                }
                return;
              }
              target.dataset.triedFallback = 'true';
              const fallbackFishCategoryKey = getFishCategoryKey(product);
              if (fallbackFishCategoryKey) {
                target.src = FISH_CATEGORY_FALLBACK_IMAGES[fallbackFishCategoryKey];
                return;
              }
            }}
          />
        </div>
        
        {/* Subtle overlay gradient for better text legibility on white badges */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent opacity-40 pointer-events-none" />
      </div>

      {/* Product Content - Now with Padding */}
      <div className="p-3.5 md:p-5 flex-1 flex flex-col bg-white">
        <div className="flex-1 flex flex-col">
          <h3 className="text-[15px] md:text-[18px] font-[700] text-[#072F4A] line-clamp-1 leading-tight mb-1.5 group-hover:text-[#2563eb] transition-colors duration-300">
            {product.name || product.productName || ''}
          </h3>
          <p className="text-[12px] md:text-[14px] text-gray-500 leading-relaxed line-clamp-2 min-h-[2.8em] mb-3">
            {product.smallDescription || product.description || `Premium fresh ${product.name} delivered to your doorstep.`}
          </p>
        </div>

        {/* Bottom Action Area */}
        <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-50">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Price</span>
            <span className="text-[18px] md:text-[22px] font-[800] text-[#072F4A] tracking-tight">
              {resolvedDisplayPrice !== null ? `₹${resolvedDisplayPrice.toLocaleString('en-IN')}` : 'Price N/A'}
            </span>
          </div>

          <div className="flex items-center">
            <button
              ref={addButtonRef}
              disabled={product.isAvailable === false || ((product.stock !== undefined && product.stock <= 0) || product.status === "Sold out")}
              onClick={handleAdd}
              className={`min-w-[40px] h-[40px] md:min-w-[44px] md:h-[44px] px-3 rounded-[12px] md:rounded-[14px] flex items-center justify-center font-bold transition-all active:scale-90 shadow-sm ${
                product.isAvailable === false || ((product.stock !== undefined && product.stock <= 0) || product.status === "Sold out")
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : inCartQty > 0 
                    ? 'bg-[#2563eb] text-white' 
                    : 'bg-[#072F4A] text-white hover:bg-[#001D33] hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {inCartQty > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-[14px] md:text-[16px]">{inCartQty}</span>
                  <span className="text-[12px] opacity-80 font-medium">In Cart</span>
                </div>
              ) : (
                <span className="text-[20px] md:text-[22px]">+</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
