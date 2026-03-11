import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { Product } from '../../../types/domain';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { useLocation } from '../../../hooks/useLocation';
import { useToast } from '../../../context/ToastContext'; // Import useToast
import { addToWishlist, removeFromWishlist, getWishlist } from '../../../services/api/customerWishlistService';
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
  showHeartIcon = true,
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
  const { isAuthenticated } = useAuth();
  const { location } = useLocation();
  const { showToast } = useToast(); // Get toast function
  const imageRef = useRef<HTMLImageElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  // Single ref to track any cart operation in progress for this product
  const isOperationPendingRef = useRef(false);

  useEffect(() => {
    // Only check wishlist if user is authenticated
    if (!isAuthenticated) {
      setIsWishlisted(false);
      return;
    }

    const checkWishlist = async () => {
      try {
        const res = await getWishlist({
          latitude: location?.latitude,
          longitude: location?.longitude
        });
        if (res.success && res.data && res.data.products) {
          const targetId = String((product as any).id || product._id);
          const exists = res.data.products.some(p => String(p._id || (p as any).id) === targetId);
          setIsWishlisted(exists);
        }
      } catch (e) {
        // Silently fail if not logged in
        setIsWishlisted(false);
      }
    };
    checkWishlist();
  }, [product.id, product._id, isAuthenticated, location?.latitude, location?.longitude]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const targetId = String((product as any).id || product._id);
    const previousState = isWishlisted;

    try {
      if (isWishlisted) {
        // Optimistic update
        setIsWishlisted(false);
        await removeFromWishlist(targetId);
        showToast('Removed from wishlist');
      } else {
        if (!location?.latitude || !location?.longitude) {
          showToast('Location is required to add items to wishlist', 'error');
          return;
        }
        // Optimistic update
        setIsWishlisted(true);
        await addToWishlist(
          targetId,
          location?.latitude,
          location?.longitude
        );
        showToast('Added to wishlist');
      }
    } catch (e: any) {
      console.error('Failed to toggle wishlist:', e);
      setIsWishlisted(previousState);
      const errorMessage = e.response?.data?.message || e.message || 'Failed to update wishlist';
      showToast(errorMessage, 'error');
    }
  };

  const cartItem = cart.items.find((item) => {
    if (!item?.product) return false;
    const itemProdId = String(item.product.id || item.product._id);
    const prodId = String((product as any).id || product._id);
    return itemProdId === prodId;
  });
  const inCartQty = cartItem?.quantity || 0;

  // Get Price and MRP using utility
  const { displayPrice, mrp, discount } = calculateProductPrice(product);

  const isFishProduct = (p: Product): boolean => {
    const name = (p.name || (p as any).productName || "").toLowerCase();
    const categoryName = (p as any).categoryData?.name?.toLowerCase() || "";
    const categoryId = String(p.category || p.categoryId || "").toLowerCase();

    const fishKeywords = [
      'fish', 'machi', 'mach', 'ilis', 'rohu', 'katla', 'prawn', 'shrimp',
      'lobster', 'sea', 'marin', 'aqua', 'bengali', 'bangali', 'river',
      'ocean', 'freshwater', 'ayre', 'pabda', 'tengra', 'rui', 'mirgal'
    ];

    return fishKeywords.some(kw => name.includes(kw) || categoryName.includes(kw) || categoryId.includes(kw));
  };

  const isFish = isFishProduct(product);

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
            src={product.imageUrl || product.mainImage}
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
              const name = (product.name || product.productName || '').toLowerCase();
              const catSlug = String(product.category || product.categoryId || '').toLowerCase();

              if (name.includes('fish') || name.includes('machi') || name.includes('mach') ||
                catSlug.includes('fish') || catSlug.includes('marin') || catSlug.includes('aqua') || catSlug.includes('bengali')) {

                // Try to find the most appropriate generic fish image
                if (catSlug.includes('marin') || name.includes('sea') || name.includes('marine')) {
                  target.src = '/images/marin_fish.png';
                } else if (catSlug.includes('bengali') || name.includes('bengali') || name.includes('ilis') || name.includes('mach')) {
                  target.src = '/images/bengali_fish.png';
                } else {
                  target.src = '/images/aqua_fish.png';
                }
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
            ₹{displayPrice.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-[6px] md:gap-[8px]">
          {showHeartIcon && (
            <button
              onClick={toggleWishlist}
              className="w-[30px] h-[30px] md:w-[36px] md:h-[36px] bg-[#eef2ff] rounded-[8px] md:rounded-[10px] flex items-center justify-center text-[#6366f1] hover:bg-[#e0e7ff] transition-all active:scale-95"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg
                width="16"
                height="16"
                md-width="20"
                md-height="20"
                viewBox="0 0 24 24"
                fill={isWishlisted ? "#6366f1" : "none"}
                xmlns="http://www.w3.org/2000/svg"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4 md:w-5 md:h-5"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          )}

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
