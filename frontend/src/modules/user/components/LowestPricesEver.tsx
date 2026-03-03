import { useRef, useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts } from '../../../services/api/customerProductService';

import { getTheme } from '../../../utils/themes';
import { useCart } from '../../../context/CartContext';
import { Product } from '../../../types/domain';
import { useWishlist } from '../../../hooks/useWishlist';
import { calculateProductPrice } from '../../../utils/priceUtils';
import { UnderwaterEffect } from '../../../components/UnderwaterEffect';

interface LowestPricesEverProps {
  activeTab?: string;
  products?: Product[]; // Admin-selected products from home data
}

// Helper function to truncate text to a maximum length
const truncateText = (text: string, maxLength: number = 60): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Product Card Component - Defined outside to prevent recreation on every render
const ProductCard = memo(({
  product,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity
}: {
  product: Product;
  cartQuantity: number;
  onAddToCart: (product: Product, element?: HTMLElement | null) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}) => {
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist } = useWishlist(product.id);

  // Get Price and MRP using utility
  const { displayPrice, mrp, discount, hasDiscount } = calculateProductPrice(product);

  // Use cartQuantity from props
  const inCartQty = cartQuantity;

  // Get product name, clean it (remove description suffixes), and truncate if needed
  let productName = product.name || product.productName || '';
  // Remove common description patterns like " - Fresh & Quality Assured", " - Premium Quality", etc.
  productName = productName.replace(/\s*-\s*(Fresh|Quality|Assured|Premium|Best|Top|Hygienic|Carefully|Selected).*$/i, '').trim();
  const displayName = truncateText(productName, 60);

  return (
    <div
      className="flex-shrink-0 w-[140px]"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div
        onClick={() => navigate(`/product/${product.id}`)}
        className="water-card water-shimmer-border rounded-xl overflow-hidden flex flex-col relative h-full max-h-full cursor-pointer group"
      >
        {/* 🌊 UNDERWATER CARD ENHANCEMENTS */}
        <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none z-20" />

        {/* Micro shimmer swipe animation on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.2] to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none z-20" />

        {/* Product Image Area */}
        <div className="relative block bg-transparent">
          <div className="w-full h-28 flex items-center justify-center overflow-hidden relative">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-[0_8px_15px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5 text-[#BEEFFF] text-4xl">
                {(product.name || product.productName || '?').charAt(0).toUpperCase()}
              </div>
            )}

            {/* Red Discount Badge - Top Left */}
            {discount > 0 && (
              <div className="absolute top-1.5 left-1.5 z-10 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                {discount}% OFF
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="p-2 flex-1 flex flex-col min-h-0 bg-transparent">
          {/* Product Name */}
          <div className="mb-1">
            <h3 className="text-[11px] font-bold text-white line-clamp-2 leading-tight min-h-[2.2rem] max-h-[2.2rem] overflow-hidden" title={productName}>
              {displayName}
            </h3>
          </div>

          {/* Price */}
          <div className="mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-[14px] font-black text-[#1CA7C7]">
                ₹{displayPrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-[10px] text-[#BEEFFF]/40 line-through">
                  ₹{mrp.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <Link
            to={`/category/${product.categoryId || 'all'}`}
            className="w-full bg-white/5 text-[#BEEFFF] text-[9px] font-bold py-1 rounded-lg flex items-center justify-between px-2 border border-white/5 hover:bg-white/10 transition-all mt-auto"
          >
            <span>Details</span>
            <svg width="6" height="6" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0L8 4L0 8Z" fill="#1CA7C7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.cartQuantity === nextProps.cartQuantity
  );
});

ProductCard.displayName = 'ProductCard';

export default function LowestPricesEver({ activeTab = 'all', products: adminProducts }: LowestPricesEverProps) {
  const theme = getTheme(activeTab);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { cart } = useCart();
  const [fontLoaded, setFontLoaded] = useState(false);

  // Preload and wait for font to load to prevent FOUT
  useEffect(() => {
    if (document.fonts && document.fonts.check) {
      // Check if font is already loaded
      if (document.fonts.check('1em "Poppins"')) {
        setFontLoaded(true);
        return;
      }

      // Wait for font to load
      const checkFont = async () => {
        try {
          await document.fonts.load('1em "Poppins"');
          setFontLoaded(true);
        } catch (e) {
          // Fallback: show after timeout
          setTimeout(() => setFontLoaded(true), 300);
        }
      };

      checkFont();
    } else {
      // Fallback for browsers without Font Loading API
      setTimeout(() => setFontLoaded(true), 300);
    }
  }, []);

  // Memoize cart items lookup for performance
  const cartItemsMap = useMemo(() => {
    const map = new Map();
    cart.items.forEach(item => {
      if (item?.product) {
        const id = String(item.product.id || item.product._id);
        map.set(id, (map.get(id) || 0) + item.quantity);
      }
    });
    return map;
  }, [cart.items]);

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Use admin-selected products if provided, otherwise fallback to fetching
    if (adminProducts && adminProducts.length > 0) {
      const mappedProducts = adminProducts.map((p: any) => {
        // Get product name and remove any description-like suffixes
        let productName = p.productName || p.name || '';
        // Remove common description patterns like " - Fresh & Quality Assured"
        productName = productName.replace(/\s*-\s*(Fresh|Quality|Assured|Premium|Best|Top|Hygienic|Carefully|Selected).*$/i, '').trim();

        // Get pack without description
        let packValue = p.variations?.[0]?.title || p.pack || 'Standard';
        // Remove description from pack if it contains it
        if (packValue && packValue.includes(' - ')) {
          packValue = packValue.split(' - ')[0].trim();
        }

        return {
          ...p,
          id: p._id || p.id || p.id,
          name: productName,
          imageUrl: p.mainImage || p.imageUrl || p.mainImage,
          mrp: p.mrp || p.price,
          pack: packValue
        };
      });
      setProducts(mappedProducts);
    } else {
      // Fallback: fetch products if admin hasn't configured any
      const fetchDiscountedProducts = async () => {
        try {
          const response = await getProducts({ limit: 50 });
          if (response.success && response.data) {
            const mappedProducts = (response.data as any[]).map(p => {
              let productName = p.productName || p.name || '';
              productName = productName.replace(/\s*-\s*(Fresh|Quality|Assured|Premium|Best|Top|Hygienic|Carefully|Selected).*$/i, '').trim();

              let packValue = p.variations?.[0]?.title || p.pack || 'Standard';
              if (packValue && packValue.includes(' - ')) {
                packValue = packValue.split(' - ')[0].trim();
              }

              return {
                ...p,
                id: p._id || p.id,
                name: productName,
                imageUrl: p.mainImage || p.imageUrl,
                mrp: p.mrp || p.price,
                pack: packValue
              };
            });
            setProducts(mappedProducts);
          }
        } catch (err) {
          console.error("Failed to fetch products for LowestPricesEver", err);
        }
      };
      fetchDiscountedProducts();
    }
  }, [adminProducts]);

  // Get products for this section
  // If using admin-selected products, use them directly (already filtered and ordered)
  // Otherwise, filter by activeTab and discount
  const getFilteredProducts = () => {
    // If admin has selected products, use them directly (already ordered)
    if (adminProducts && adminProducts.length > 0) {
      return products.slice(0, 20); // Show up to 20 admin-selected products
    }

    // Fallback: filter by activeTab and discount
    let filtered = products;

    if (activeTab !== 'all') {
      if (activeTab === 'grocery') {
        filtered = products.filter((p) =>
          ['snacks', 'atta-rice', 'dairy-breakfast', 'masala-oil', 'biscuits-bakery', 'cold-drinks', 'fruits-veg'].includes(p.categoryId)
        );
      } else {
        filtered = products.filter((p) => p.categoryId === activeTab);
      }
    }

    return filtered
      .filter((product) => {
        if (!product.mrp) return false;
        const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
        return discount > 0;
      })
      .slice(0, 10); // Show top 10 discounted products
  };

  const discountedProducts = getFilteredProducts();

  // Get cart functions once at parent level
  const { addToCart, updateQuantity } = useCart();

  // Memoize callbacks to prevent ProductCard re-renders
  const handleAddToCart = useCallback((product: Product, element?: HTMLElement | null) => {
    addToCart(product, element);
  }, [addToCart]);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  }, [updateQuantity]);

  return (
    <div
      className="relative overflow-hidden py-12"
      style={{
        background: `linear-gradient(180deg, transparent 0%, rgba(11,60,93,0.3) 100%)`,
        marginTop: '0px'
      }}
    >
      {/* 🌊 PREMIUM UNDERWATER ATMOSPHERE */}
      <UnderwaterEffect />

      {/* 🌊 Subtle Depth Enhancements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          className="absolute inset-0 mix-blend-overlay opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(ellipse at center, rgba(0, 224, 198, 0.4) 0%, transparent 70%)',
          }}
          animate={{
            opacity: [0.03, 0.07, 0.03],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* LOWEST PRICES EVER Banner */}
      <div className="px-6 relative z-10 mb-8" data-section="lowest-prices">
        <div className="flex items-center justify-center gap-6">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#1CA7C7]/50 to-[#1CA7C7]"></div>

          <h2
            className="font-black text-center whitespace-nowrap"
            style={{
              fontFamily: '"Poppins", sans-serif',
              fontSize: '32px',
              color: '#FFFFFF',
              opacity: fontLoaded ? 1 : 0,
              transition: 'opacity 0.2s ease-in',
              textShadow: '0 0 20px rgba(28,167,199,0.8), 0 0 40px rgba(28,167,199,0.4)',
              letterSpacing: '0.1em',
              fontWeight: 900,
              lineHeight: '1.1',
              transform: 'perspective(500px) rotateX(5deg)',
            } as React.CSSProperties}
          >
            LOWEST PRICES EVER
          </h2>

          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-[#1CA7C7]/50 to-[#1CA7C7]"></div>
        </div>
      </div>

      {/* Horizontal Scrollable Product Cards */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-6 pb-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {discountedProducts.map((product) => {
          const cartQuantity = cartItemsMap.get(product.id) || 0;
          return (
            <ProductCard
              key={product.id}
              product={product}
              cartQuantity={cartQuantity}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
            />
          );
        })}
      </div>
    </div>
  );
}

