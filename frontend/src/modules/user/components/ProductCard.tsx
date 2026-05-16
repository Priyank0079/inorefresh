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
  badgeText = '',
}: ProductCardProps) {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity } = useCart();
  const imageRef = useRef<HTMLImageElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const isOperationPendingRef = useRef(false);

  const cartItem = cart.items.find((item) => {
    if (!item?.product) return false;
    const itemProdId = String(item.product.id || item.product._id);
    const prodId = String((product as any).id || product._id);
    return itemProdId === prodId;
  });
  const inCartQty = cartItem?.quantity || 0;

  const { displayPrice, mrp, discount } = calculateProductPrice(product);

  type FishCategoryKey = 'aqua' | 'marine' | 'bengali';
  const FISH_CATEGORY_FALLBACK_IMAGES: Record<FishCategoryKey, string> = {
    aqua: '/images/aqua_fish.png',
    marine: '/images/fish/marine-fish.jpg',
    bengali: '/images/bengali_fish.png',
  };

  const getCategorySearchText = (p: Product): string => {
    const rawCategory = (p as any).category;
    const rawCategoryText = typeof rawCategory === 'string' ? rawCategory : `${rawCategory?.name || ''} ${rawCategory?.slug || ''}`;
    return `${rawCategoryText} ${p.categoryId || ''} ${p.categoryData?.name || ''}`.toLowerCase();
  };

  const getFishCategoryKey = (p: Product): FishCategoryKey | null => {
    const haystack = `${(p.name || '').toLowerCase()} ${getCategorySearchText(p)}`;
    if (haystack.includes('aqua') || haystack.includes('freshwater')) return 'aqua';
    if (haystack.includes('marin') || haystack.includes('sea')) return 'marine';
    if (haystack.includes('bengali')) return 'bengali';
    return null;
  };

  const isFishProduct = (p: Product): boolean => {
    const haystack = `${(p.name || '').toLowerCase()} ${getCategorySearchText(p)}`;
    return ['fish', 'machi', 'mach', 'prawn', 'shrimp', 'sea', 'marine', 'river'].some(kw => haystack.includes(kw));
  };

  const fishCategoryKey = getFishCategoryKey(product);
  const productImageSrc = product.imageUrl || product.mainImage || (fishCategoryKey ? FISH_CATEGORY_FALLBACK_IMAGES[fishCategoryKey] : '');
  const isFish = isFishProduct(product);
  const resolvedDisplayPrice = Number(displayPrice) > 0 ? Number(displayPrice) : Number(mrp) > 0 ? Number(mrp) : null;

  const handleCardClick = () => navigate(`/product/${((product as any).id || product._id) as string}`);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.isAvailable === false || isOperationPendingRef.current) return;
    isOperationPendingRef.current = true;
    try { await addToCart(product, addButtonRef.current); } finally { isOperationPendingRef.current = false; }
  };

  const handleUpdate = async (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    if (isOperationPendingRef.current || (delta < 0 && inCartQty <= 0)) return;
    isOperationPendingRef.current = true;
    try {
      const variantId = (cartItem?.product as any)?.variantId || (cartItem?.product as any)?.selectedVariant?._id;
      const variantTitle = (cartItem?.product as any)?.variantTitle || (cartItem?.product as any)?.pack;
      await updateQuantity(((product as any).id || product._id) as string, inCartQty + delta, variantId, variantTitle);
    } finally { isOperationPendingRef.current = false; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      onClick={handleCardClick}
      className="relative bg-white rounded-xl flex flex-col group transition-all duration-500 cursor-pointer overflow-hidden border border-neutral-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] w-full max-w-[280px] mx-auto"
    >
      {/* Product Image Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F9FBFC]">
        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5">
          {discount > 0 && (
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-red-500/20"
            >
              {discount}% OFF
            </motion.div>
          )}
          {isFish && (
            <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-teal-500/20">
              PREMIUM
            </div>
          )}
        </div>

        {/* Wishlist Button - Visible on mobile, hover on desktop */}
        <div className="absolute top-2.5 right-2.5 z-30 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 md:translate-y-[-10px] md:group-hover:translate-y-0">
          <WishlistButton 
            productId={String((product as any).id || product._id)} 
            size="sm"
          />
        </div>

        {/* Image with smooth zoom */}
        <motion.div className="w-full h-full p-4 flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-110">
          <img
            ref={imageRef}
            src={productImageSrc}
            alt={product.name || 'Product'}
            className="w-full h-full object-contain mix-blend-multiply"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.dataset.triedFallback === 'true') {
                target.src = '/images/placeholder.png'; // Final fallback
                return;
              }
              target.dataset.triedFallback = 'true';
              const catImg = (product as any).category?.image || product.categoryData?.imageUrl;
              if (catImg) {
                target.src = catImg;
              } else if (fishCategoryKey) {
                target.src = FISH_CATEGORY_FALLBACK_IMAGES[fishCategoryKey];
              }
            }}
          />
        </motion.div>
        
        {/* Sold Out Overlay */}
        {(product.isAvailable === false || product.stock === 0) && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="px-4 py-1.5 bg-neutral-900/90 text-white text-[10px] font-black rounded-full shadow-2xl tracking-widest uppercase">
              {product.isAvailable === false ? 'Out of Range' : 'Sold Out'}
            </span>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="p-4 flex flex-col flex-1 bg-white">
        <div className="flex-1 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[9px] font-black text-teal-600 uppercase tracking-[0.1em] px-1.5 py-0.5 bg-teal-50 rounded">
              {product.categoryData?.name || 'Fresh'}
            </span>
            <span className="text-[10px] text-neutral-400 font-medium italic">
              {product.pack || 'Standard'}
            </span>
          </div>
          
          <h3 className="text-[15px] font-bold text-neutral-900 line-clamp-1 leading-none mb-1 group-hover:text-teal-600 transition-colors duration-300">
            {product.name || product.productName || ''}
          </h3>
          <p className="text-[11px] text-neutral-400 line-clamp-1 font-medium italic">
            {product.smallDescription || product.description || 'Premium quality fresh delivery.'}
          </p>
        </div>

        {/* Pricing & Add Button Area */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-50/80">
          <div className="flex flex-col">
            {mrp && mrp > (resolvedDisplayPrice || 0) && (
              <span className="text-[11px] text-neutral-300 line-through decoration-red-400/30 font-medium mb-0.5">
                ₹{mrp}
              </span>
            )}
            <div className="flex items-baseline gap-0.5">
              <span className="text-[11px] font-bold text-neutral-400">₹</span>
              <span className="text-[19px] font-black text-neutral-900 tracking-tight">
                {resolvedDisplayPrice?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="h-9">
            {inCartQty > 0 ? (
              <motion.div 
                layoutId={`cart-btn-${product._id}`}
                className="flex items-center bg-neutral-900 rounded-xl p-1 shadow-lg shadow-black/10"
              >
                <button
                  onClick={(e) => handleUpdate(e, -1)}
                  className="w-7 h-7 flex items-center justify-center text-white hover:text-teal-400 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14" /></svg>
                </button>
                <span className="w-6 text-center text-[13px] font-black text-white">{inCartQty}</span>
                <button
                  onClick={(e) => handleUpdate(e, 1)}
                  className="w-7 h-7 flex items-center justify-center text-white hover:text-teal-400 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </motion.div>
            ) : (
              <motion.button
                layoutId={`cart-btn-${product._id}`}
                ref={addButtonRef}
                disabled={product.isAvailable === false || product.stock === 0}
                onClick={handleAdd}
                whileTap={{ scale: 0.95 }}
                className="h-full px-5 rounded-xl bg-teal-600 text-white text-[12px] font-black uppercase tracking-wider hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:grayscale disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
              >
                ADD
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M12 5v14M5 12h14" /></svg>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
