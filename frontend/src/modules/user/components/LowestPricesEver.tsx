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
import ProductCard from './ProductCard';

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
// Custom ProductCard removed to use global ProductCard component

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
          ['snacks', 'atta-rice', 'dairy-breakfast', 'biscuits-bakery', 'cold-drinks', 'fruits-veg'].includes(p.categoryId)
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
          return (
            <div key={product.id} className="flex-shrink-0 w-[170px] md:w-[200px]">
              <ProductCard
                product={product}
                badgeText={product.mrp && product.mrp > product.price ? `${Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF` : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

