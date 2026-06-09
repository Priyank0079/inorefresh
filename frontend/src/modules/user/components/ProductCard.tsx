import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRef, useMemo } from 'react';
import { memo } from 'react';
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

const FISH_CATEGORY_FALLBACK: Record<string, string> = {
  aqua: '/images/aqua_fish.webp',
  marine: '/images/marin_fish.webp',
  bengali: '/images/bengali_fish.webp',
};

function ProductCard({ product, badgeText = '' }: ProductCardProps) {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity } = useCart();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const pendingRef = useRef(false);

  // Cart state - memoized to prevent O(n*m) recalculation on every render
  const cartItem = useMemo(() =>
    cart.items.find((item) => {
      if (!item?.product) return false;
      return String(item.product.id || item.product._id) === String((product as any).id || product._id);
    }),
    [cart.items, product._id, product.id]
  );
  const inCartQty = cartItem?.quantity || 0;

  const { displayPrice, mrp, discount } = calculateProductPrice(product);
  const resolvedPrice = Number(displayPrice) > 0 ? Number(displayPrice) : Number(mrp) > 0 ? Number(mrp) : null;

  // Image resolution with smart fallback
  const getCatKey = () => {
    const haystack = `${(product.name || '').toLowerCase()} ${(product as any).category || ''} ${product.categoryId || ''}`;
    if (haystack.includes('aqua') || haystack.includes('freshwater')) return 'aqua';
    if (haystack.includes('marin') || haystack.includes('sea')) return 'marine';
    if (haystack.includes('bengali')) return 'bengali';
    return null;
  };
  const catKey = getCatKey();
  const imgSrc = product.imageUrl || product.mainImage || (catKey ? FISH_CATEGORY_FALLBACK[catKey] : '');

  // Premium badge logic (fish / seafood products)
  const isPremium = ['fish', 'machi', 'prawn', 'shrimp', 'sea', 'marine', 'river'].some(kw =>
    (product.name || '').toLowerCase().includes(kw) ||
    (product.categoryId || '').toLowerCase().includes(kw)
  );

  const isSoldOut = product.isAvailable === false || product.stock === 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSoldOut || pendingRef.current) return;
    pendingRef.current = true;
    try { await addToCart(product, addButtonRef.current); } finally { pendingRef.current = false; }
  };

  const handleUpdate = async (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    if (pendingRef.current || (delta < 0 && inCartQty <= 0)) return;
    pendingRef.current = true;
    try {
      const variantId = (cartItem?.product as any)?.variantId || (cartItem?.product as any)?.selectedVariant?._id;
      const variantTitle = (cartItem?.product as any)?.variantTitle || (cartItem?.product as any)?.pack;
      await updateQuantity(String((product as any).id || product._id), inCartQty + delta, variantId, variantTitle);
    } finally { pendingRef.current = false; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      onClick={() => navigate(`/product/${String((product as any).id || product._id)}`)}
      className="relative rounded-2xl flex flex-col cursor-pointer overflow-hidden border border-[#A8E6F5]/40 shadow-[0_2px_8px_rgba(17,111,146,0.10)] hover:shadow-[0_8px_24px_rgba(17,111,146,0.18)] transition-all duration-300 w-full h-fit"
      style={{ background: 'linear-gradient(160deg, #EBF9FF 0%, #D6F1FA 60%, #C4EAF7 100%)' }}
    >
      {/* ── Image ─────────────────────────────── */}
      <div className="relative w-full h-40 overflow-hidden bg-[#EAF6FB] flex items-center justify-center">
        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-red-500 to-pink-600 text-white text-[8px] font-black uppercase tracking-wider shadow-sm leading-none">
            {discount}% OFF
          </div>
        )}

        {/* Premium badge */}
        {isPremium && (
          <div className={`absolute z-20 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-[8px] font-black uppercase tracking-wider shadow-sm leading-none ${discount > 0 ? 'top-7 left-2' : 'top-2 left-2'}`}>
            PREMIUM
          </div>
        )}

        {/* Wishlist */}
        <div className="absolute top-1.5 right-1.5 z-30 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <WishlistButton
            productId={String((product as any).id || product._id)}
            size="sm"
          />
        </div>

        {/* Product image */}
        <img
          src={imgSrc}
          alt={product.name || 'Product'}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            if (t.dataset.tried) { t.src = '/images/aqua_fish.webp'; return; }
            t.dataset.tried = 'true';
            const catImg = (product as any).category?.image || product.categoryData?.imageUrl;
            t.src = catImg || (catKey ? FISH_CATEGORY_FALLBACK[catKey] : '/images/aqua_fish.webp');
          }}
        />

        {/* Sold-out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 w-full h-full bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-2.5 py-1 bg-neutral-900/85 text-white text-[9px] font-black rounded-full tracking-widest uppercase shadow-xl">
              {product.isAvailable === false ? 'Out of Range' : 'Sold Out'}
            </span>
          </div>
        )}
      </div>

      {/* ── Info ──────────────────────────────── */}
      <div className="px-2.5 pt-2 pb-2 flex flex-col gap-0.5" style={{ background: 'linear-gradient(180deg, #D6F1FA 0%, #C4EAF7 100%)' }}>
        {/* Category + pack row */}
        <div className="flex items-center gap-1 min-w-0">
          <span className="flex-shrink-0 text-[7.5px] font-extrabold text-teal-600 uppercase tracking-[0.07em] px-1.5 py-[2px] bg-teal-50 rounded leading-none">
            {product.categoryData?.name || 'FRESH'}
          </span>
          <span className="text-[8.5px] text-neutral-400 font-medium truncate leading-none">
            {product.pack || 'Standard'}
          </span>
        </div>

        {/* Product name */}
        <h3 className="text-[12px] font-bold text-[#072F4A] line-clamp-1 leading-tight">
          {product.name || product.productName || ''}
        </h3>

        {/* Description */}
        {(product.smallDescription || product.description) && (
          <p className="text-[9.5px] text-[#3a7a94] leading-snug line-clamp-1 font-medium mt-0.5">
            {product.smallDescription || product.description}
          </p>
        )}

        {/* Price + Add button */}
        <div className="flex items-center justify-between mt-0.5 pt-1 border-t border-[#9FD8EE]/50">
          {/* Price column */}
          <div className="flex flex-col leading-none">
            {mrp && mrp > (resolvedPrice || 0) && (
              <span className="text-[8px] text-neutral-300 line-through font-medium leading-none mb-0.5">
                ₹{mrp}
              </span>
            )}
            <div className="flex items-baseline gap-0.5">
              <span className="text-[9px] font-bold text-neutral-500">₹</span>
              <span className="text-[15px] font-black text-neutral-900 tracking-tight leading-none">
                {resolvedPrice?.toLocaleString('en-IN') ?? '—'}
              </span>
            </div>
          </div>

          {/* Cart control */}
          <div className="h-[26px] flex-shrink-0">
            {inCartQty > 0 ? (
              <motion.div
                layoutId={`cart-btn-${product._id}`}
                className="flex items-center bg-neutral-900 rounded-lg overflow-hidden shadow-md h-full"
              >
                <button
                  onClick={(e) => handleUpdate(e, -1)}
                  className="w-6 h-full flex items-center justify-center text-white hover:bg-neutral-700 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12h14" /></svg>
                </button>
                <span className="w-5 text-center text-[11px] font-black text-white">{inCartQty}</span>
                <button
                  onClick={(e) => handleUpdate(e, 1)}
                  className="w-6 h-full flex items-center justify-center text-white hover:bg-neutral-700 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              </motion.div>
            ) : (
              <motion.button
                layoutId={`cart-btn-${product._id}`}
                ref={addButtonRef}
                disabled={isSoldOut}
                onClick={handleAdd}
                whileTap={{ scale: 0.93 }}
                className="h-full px-3 rounded-lg bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm shadow-teal-600/20 disabled:grayscale disabled:opacity-50 flex items-center gap-1"
              >
                ADD
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M12 5v14M5 12h14" /></svg>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(ProductCard);
