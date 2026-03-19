import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useRef } from 'react';
import { Product } from '../../../types/domain';
import { useCart } from '../../../context/CartContext';
import { calculateProductPrice } from '../../../utils/priceUtils';

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
    marine: '/images/marin_fish.png',
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
      'lobster', 'sea', 'marin', 'aqua', 'bengali', 'bangali', 'river',
      'ocean', 'freshwater', 'ayre', 'pabda', 'tengra', 'rui', 'mirgal'
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
      whileHover={{ y: -6, boxShadow: '0 18px 40px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={handleCardClick}
      className="relative bg-[#ffffff] rounded-[20px] md:rounded-[24px] p-3 md:p-[22px] flex flex-col group transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100/30"
      style={{
        boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
        fontFamily: 'Inter, Poppins, sans-serif'
      }}
    >
      {/* 3 Availability Badge */}
      <div className="absolute top-[10px] left-[10px] md:top-[16px] md:left-[16px] z-10 flex flex-col gap-1">
        <div className="px-[8px] py-[2px] md:px-[10px] md:py-[4px] rounded-[8px] md:rounded-[10px] bg-[#eef2ff] text-[#2563eb] text-[10px] md:text-[12px] font-[500] uppercase tracking-wide">
          {badgeText || (product.isAvailable === false ? 'Out of Range' : `${product.stock || 0} AVAILABLE`)}
        </div>
        {isFish && (
          <div className="px-[8px] py-[2px] md:px-[10px] md:py-[4px] rounded-[8px] md:rounded-[10px] bg-[#fff7ed] text-[#ea580c] text-[10px] md:text-[12px] font-[700] uppercase tracking-wide border border-[#fdba74]">
            🐟 MIN 5KG
          </div>
        )}
      </div>

      {/* 2 Product Image Area */}
      <div className="relative mt-7 mb-3 md:mt-8 md:mb-4">
        <div className="w-[100px] h-[100px] md:w-[140px] md:h-[140px] bg-[#f3f5f9] rounded-full flex items-center justify-center mx-auto transition-transform duration-500 group-hover:scale-105">
          <img
            ref={imageRef}
            src={productImageSrc}
            alt={product.name || product.productName || 'Product'}
            className="w-[75px] h-auto md:w-[105px] object-contain drop-shadow-md"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;

              // Only try fallbacks once to prevent infinite loops
              if (target.dataset.triedFallback === 'true') {
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.fallback-icon')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'text-xl md:text-2xl font-bold text-gray-300 fallback-icon';
                  fallback.textContent = (product.name || product.productName || '?').charAt(0).toUpperCase();
                  parent.appendChild(fallback);
                }
                return;
              }

              // Set flag that we've tried a fallback
              target.dataset.triedFallback = 'true';

              // Specific fallbacks for fish categories to ensure they load properly
              const fallbackFishCategoryKey = getFishCategoryKey(product);
              if (fallbackFishCategoryKey) {
                target.src = FISH_CATEGORY_FALLBACK_IMAGES[fallbackFishCategoryKey];
                return;
              }

              // Default behavior for other products
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-icon')) {
                const fallback = document.createElement('div');
                fallback.className = 'text-xl md:text-2xl font-bold text-gray-300 fallback-icon';
                fallback.textContent = (product.name || product.productName || '?').charAt(0).toUpperCase();
                parent.appendChild(fallback);
              }
            }}
          />
        </div>
      </div>

      {/* 4 & 5 Product Text Content */}
      <div className="flex-1 flex flex-col pt-0 md:pt-1">
        <h3 className="text-[14px] md:text-[17px] font-[600] text-[#072F4A] line-clamp-1 leading-tight mb-0.5 md:mb-1">
          {product.name || product.productName || ''}
        </h3>
        <p className="text-[11px] md:text-[13px] text-[#6b7280] leading-[1.3] md:leading-[1.4] line-clamp-2 min-h-[2.6em] md:min-h-[2.8em]">
          {product.smallDescription || product.description || `Fresh ${product.name} directly from source.`}
        </p>
      </div>

      {/* 7 & 8 Bottom Action Area */}
      <div className="flex justify-between items-center mt-3 md:mt-[18px]">
        <div className="flex flex-col">
          <span className="text-[18px] md:text-[22px] font-[700] text-[#072F4A] tracking-tight">
            {resolvedDisplayPrice !== null ? `Rs.${resolvedDisplayPrice.toLocaleString('en-IN')}` : 'Price N/A'}
          </span>
        </div>

        <div className="flex items-center gap-[6px] md:gap-[8px]">
          <button
            ref={addButtonRef}
            disabled={product.isAvailable === false || ((product.stock !== undefined && product.stock <= 0) || product.status === "Sold out")}
            onClick={handleAdd}
            className={`w-[30px] h-[30px] md:w-[36px] md:h-[36px] rounded-[8px] md:rounded-[10px] flex items-center justify-center font-bold transition-all active:scale-95 ${product.isAvailable === false || ((product.stock !== undefined && product.stock <= 0) || product.status === "Sold out")
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#072F4A] text-white hover:bg-[#001D33]'
              }`}
          >
            {inCartQty > 0 ? (
              <span className="text-[13px] md:text-[15px]">{inCartQty}</span>
            ) : (
              <span className="text-[18px] md:text-[20px] mb-0.5">+</span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
