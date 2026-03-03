import { useLayoutEffect, useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Link, useNavigate } from "react-router-dom";
import { getTheme } from "../../../utils/themes";
import { getHomeContent } from "../../../services/api/customerHomeService";
import { getSubcategories } from "../../../services/api/categoryService";
import { apiCache } from "../../../utils/apiCache";
import { useLocation } from "../../../hooks/useLocation";
import { calculateProductPrice } from "../../../utils/priceUtils";
import { UnderwaterEffect } from "../../../components/UnderwaterEffect";

interface PromoCard {
  id: string;
  badge: string;
  title: string;
  imageUrl?: string;
  categoryId?: string;
  slug?: string;
  bgColor?: string;
  subcategoryImages?: string[]; // Array of subcategory image URLs
}

// Icon mappings for each category
const getCategoryIcons = (categoryId: string) => {
  const iconMap: Record<string, string[]> = {
    "personal-care": ["🧴", "💧", "🧼", "💄"],
    "breakfast-instant": ["🍜", "☕", "🥛", "🍞"],
    "atta-rice": ["🌾", "🍚", "🫘", "🫒"],
    household: ["🧹", "🧽", "🧼", "🧴"],
    "home-office": ["🏠", "💼", "📦", "🎁"],
    fashion: ["👕", "👗", "👠", "👜"],
    electronics: ["📱", "💻", "⌚", "🎧"],
    "fruits-veg": ["🥬", "🥕", "🍅", "🥒"],
    "dairy-breakfast": ["🥛", "🧀", "🍞", "🥚"],
    snacks: ["🍿", "🍪", "🥨", "🍫"],
    sports: ["⚽", "🏀", "🏋️", "🎾"],
  };
  return iconMap[categoryId] || ["📦", "📦", "📦", "📦"];
};

interface PromoStripProps {
  activeTab?: string;
}

export default function PromoStrip({ activeTab = "all" }: PromoStripProps) {
  const { location } = useLocation();
  const theme = getTheme(activeTab);
  const navigate = useNavigate();
  const [categoryCards, setCategoryCards] = useState<PromoCard[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [headingText, setHeadingText] = useState(theme.bannerText);
  const [saleTextValue, setSaleTextValue] = useState(theme.saleText);
  const [dateRange, setDateRange] = useState("");
  const [crazyDealsTitle, setCrazyDealsTitle] = useState("CRAZY DEALS");
  const [subcategoryImagesMap, setSubcategoryImagesMap] = useState<Record<string, string[]>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const snowflakesRef = useRef<HTMLDivElement>(null);
  const housefullRef = useRef<HTMLDivElement>(null);
  const saleRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const priceContainerRef = useRef<HTMLDivElement>(null);
  const productNameRef = useRef<HTMLDivElement>(null);
  const productImageRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  // Fetch subcategory images for category cards - DEFERRED for faster initial load
  const fetchSubcategoryImages = useCallback(async (cards: PromoCard[]) => {
    // Defer subcategory image fetching to not block initial render
    // Load them after a short delay to prioritize main content
    setTimeout(async () => {
      const imagesMap: Record<string, string[]> = {};

      // Fetch images in batches to avoid overwhelming the network
      const batchSize = 2;
      for (let i = 0; i < cards.length; i += batchSize) {
        const batch = cards.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (card) => {
            const categoryId = card.categoryId;
            if (!categoryId) return;

            try {
              const response = await getSubcategories(categoryId, { limit: 4 });
              if (response.success && response.data) {
                const images = response.data
                  .filter((subcat) => subcat.subcategoryImage)
                  .map((subcat) => subcat.subcategoryImage!)
                  .slice(0, 4);

                if (images.length > 0) {
                  imagesMap[card.id] = images;
                }
              }
            } catch (error) {
              // Silently fail - emoji fallback will be used
              console.error(`Error fetching subcategories for category ${categoryId}:`, error);
            }
          })
        );
        // Small delay between batches to prevent network congestion
        if (i + batchSize < cards.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      setSubcategoryImagesMap(imagesMap);
    }, 300); // 300ms delay - allows main content to render first
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Check cache first before showing loading state
      const cacheKey = `home-content-${activeTab || 'all'}`;
      const cachedData = apiCache.getSync(cacheKey);

      // Only show loading if data is not cached
      if (!cachedData) {
        setLoading(true);
      }

      try {
        // Pass activeTab (header category slug) and location to filter categories
        // Use cache with 5 minute TTL for faster loading
        const response = await getHomeContent(
          activeTab,
          location?.latitude,
          location?.longitude,
          true,
          5 * 60 * 1000
        );

        // Reset current product index when fetching new data
        setCurrentProductIndex(0);

        let fetchedCards: PromoCard[] = [];
        let fetchedProducts: any[] = [];
        let newHeadingText = theme.bannerText;
        let newSaleTextValue = theme.saleText;
        let newDateRange = "";

        if (response.success && response.data) {
          // 1. Check for PromoStrip data from backend (highest priority)
          if (response.data.promoStrip && response.data.promoStrip.isActive) {
            const promoStrip = response.data.promoStrip;
            newHeadingText = promoStrip.heading || newHeadingText;
            newSaleTextValue = promoStrip.saleText || newSaleTextValue;
            // Set CRAZY DEALS title from PromoStrip
            if (promoStrip.crazyDealsTitle) {
              setCrazyDealsTitle(promoStrip.crazyDealsTitle);
            } else {
              setCrazyDealsTitle("CRAZY DEALS");
            }

            // Format date range
            if (promoStrip.startDate && promoStrip.endDate) {
              const start = new Date(promoStrip.startDate);
              const end = new Date(promoStrip.endDate);
              newDateRange = `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}`;
            }

            // Map category cards from PromoStrip
            if (promoStrip.categoryCards && promoStrip.categoryCards.length > 0) {
              fetchedCards = promoStrip.categoryCards
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                .map((card: any) => {
                  const category = typeof card.categoryId === 'object' ? card.categoryId : null;
                  return {
                    id: card._id || card.categoryId?._id || card.categoryId,
                    badge: card.badge || `Up to ${card.discountPercentage || 0}% OFF`,
                    title: card.title || category?.name || "",
                    categoryId: category?._id || card.categoryId, // Use _id for fetching subcategories
                    slug: category?.slug || card.categoryId, // Use slug for navigation
                    imageUrl: category?.image,
                    bgColor: "bg-yellow-50",
                  };
                });
            }

            // Map featured products from PromoStrip
            if (promoStrip.featuredProducts && promoStrip.featuredProducts.length > 0) {
              fetchedProducts = promoStrip.featuredProducts.map((p: any) => {
                const product = typeof p === 'object' ? p : null;
                const price = Number(product?.price) || 0;
                const mrp = Number(product?.mrp) || Number(product?.compareAtPrice) || 0;
                const originalPrice = mrp > 0 ? mrp : (price > 0 ? Math.round(price * 1.2) : 999);
                const discountedPrice = price > 0 ? price : 499;

                // Try multiple image field names and fallbacks
                const imageUrl =
                  product?.mainImage ||
                  product?.mainImageUrl ||
                  product?.image ||
                  product?.imageUrl ||
                  (product?.galleryImageUrls && product.galleryImageUrls.length > 0 ? product.galleryImageUrls[0] : null) ||
                  (product?.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : null) ||
                  null;

                // Always prioritize productName to avoid showing category names
                const productName = product?.productName || product?.name || "Product";

                return {
                  id: product?._id || p,
                  _id: product?._id || p,
                  name: productName,
                  productName: productName, // Always use productName, never category name
                  price: price,
                  mrp: mrp,
                  originalPrice: isNaN(originalPrice) ? 999 : originalPrice,
                  discountedPrice: isNaN(discountedPrice) ? 499 : discountedPrice,
                  imageUrl: imageUrl,
                };
              });
            }
          }
          // 2. Fallback to promoCards if no PromoStrip
          else if (response.data.promoCards && response.data.promoCards.length > 0) {
            fetchedCards = response.data.promoCards;
          }
          // 3. Fallback to categories if no promo cards
          else if (
            response.data.categories &&
            response.data.categories.length > 0
          ) {
            fetchedCards = response.data.categories
              .slice(0, 4)
              .map((c: any) => ({
                id: c._id || c.id,
                badge: "Up to 50% OFF",
                title: c.name,
                categoryId: c.slug || c._id,
                bgColor: c.color || "bg-yellow-50",
              }));
          }

          // Fallback: Map bestsellers to FeaturedProducts if no PromoStrip featured products
          if (fetchedProducts.length === 0 && response.data.bestsellers && response.data.bestsellers.length > 0) {
            fetchedProducts = response.data.bestsellers.map((p: any) => {
              const price = Number(p.price) || 0;
              const mrp = Number(p.mrp) || 0;
              const originalPrice = mrp > 0 ? mrp : (price > 0 ? Math.round(price * 1.2) : 999);
              const discountedPrice = price > 0 ? price : 499;

              // Try multiple image field names and fallbacks
              const imageUrl =
                p.mainImage ||
                p.mainImageUrl ||
                p.image ||
                p.imageUrl ||
                (p.galleryImageUrls && p.galleryImageUrls.length > 0 ? p.galleryImageUrls[0] : null) ||
                (p.galleryImages && p.galleryImages.length > 0 ? p.galleryImages[0] : null) ||
                (p.productImages && p.productImages.length > 0 ? p.productImages[0] : null) ||
                null;

              // Always prioritize productName to avoid showing category names
              const productName = p.productName || p.name || "Product";

              return {
                id: p._id,
                _id: p._id,
                name: productName,
                productName: productName, // Always use productName, never category name
                price: price,
                mrp: mrp,
                originalPrice: isNaN(originalPrice) ? 999 : originalPrice,
                discountedPrice: isNaN(discountedPrice) ? 499 : discountedPrice,
                imageUrl: imageUrl,
              };
            });
          }
        }

        setCategoryCards(fetchedCards);
        setFeaturedProducts(fetchedProducts);
        setHeadingText(newHeadingText);
        setSaleTextValue(newSaleTextValue);
        setDateRange(newDateRange);
        // Reset CRAZY DEALS title if no PromoStrip data
        if (!response.data?.promoStrip || !response.data.promoStrip.isActive) {
          setCrazyDealsTitle("CRAZY DEALS");
        }
        setHasData(fetchedCards.length > 0 || fetchedProducts.length > 0);

        // Fetch subcategory images AFTER setting hasData to true
        // This allows the main content to render immediately
        if (fetchedCards.length > 0) {
          fetchSubcategoryImages(fetchedCards);
        }
      } catch (error) {
        console.error("Error fetching home content for PromoStrip:", error);
        setCategoryCards([]);
        setFeaturedProducts([]);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // REMOVED: Polling every 30 seconds causes unnecessary re-renders and API calls
    // If real-time updates are needed, consider using WebSockets or Server-Sent Events
    // For now, data will only refresh when activeTab changes

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, theme.bannerText, theme.saleText]);

  // Reset product index when activeTab changes or featuredProducts change
  useEffect(() => {
    setCurrentProductIndex(0);
  }, [activeTab, featuredProducts.length]);

  useLayoutEffect(() => {
    if (!hasData) return;
    const container = containerRef.current;
    if (!container) return;

    let ctx: gsap.Context | null = null;

    // Defer card animation to prioritize content rendering
    const timeoutId = setTimeout(() => {
      ctx = gsap.context(() => {
        const cards = container.querySelectorAll(".promo-card");
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.4, // Reduced duration
              stagger: 0.05, // Reduced stagger
              ease: "power2.out", // Simpler easing
            }
          );
        }
      }, container);
    }, 100); // Start animation 100ms after render

    return () => {
      clearTimeout(timeoutId);
      if (ctx) {
        ctx.revert();
      }
    };
  }, [hasData]);

  // Snowflake animation - DEFERRED for faster initial load
  useLayoutEffect(() => {
    if (!hasData) return;
    const snowflakesContainer = snowflakesRef.current;
    if (!snowflakesContainer) return;

    // Defer animation start to prioritize content rendering
    const timeoutId = setTimeout(() => {
      const snowflakes = snowflakesContainer.querySelectorAll(".snowflake");

      snowflakes.forEach((snowflake, index) => {
        const delay = index * 0.3;
        const duration = 3 + Math.random() * 2; // 3-5 seconds
        const xOffset = (Math.random() - 0.5) * 40; // Random horizontal drift

        gsap.set(snowflake, {
          y: -20,
          x: xOffset,
          opacity: 0.8 + Math.random() * 0.2, // 0.8-1.0 opacity for better visibility
          scale: 0.6 + Math.random() * 0.4, // 0.6-1.0 scale for better visibility
        });

        gsap.to(snowflake, {
          y: "+=200",
          x: `+=${xOffset}`,
          duration: duration,
          delay: delay,
          ease: "none",
          repeat: -1,
        });
      });
    }, 200); // Start animation 200ms after render

    return () => {
      clearTimeout(timeoutId);
      const snowflakes = snowflakesContainer.querySelectorAll(".snowflake");
      snowflakes.forEach((snowflake) => {
        gsap.killTweensOf(snowflake);
      });
    };
  }, [hasData]);

  // HOUSEFULL SALE animation - SIMPLIFIED and DEFERRED for faster load
  useLayoutEffect(() => {
    if (!hasData) return;
    const housefullContainer = housefullRef.current;
    const saleText = saleRef.current;
    const dateText = dateRef.current;
    if (!housefullContainer) return;

    // Defer animation start to prioritize content rendering
    const timeoutId = setTimeout(() => {
      const letters = housefullContainer.querySelectorAll(".housefull-letter");

      // Simplified animation - single entrance animation instead of loop
      gsap.set([housefullContainer, saleText, dateText], {
        scale: 0.8,
        opacity: 0,
      });

      gsap.to([housefullContainer, saleText, dateText], {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(1.7)",
      });

      // Simplified letter animation - only run once
      gsap.to(letters, {
        y: -10,
        duration: 0.15,
        stagger: 0.04,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
      });
    }, 150); // Start animation 150ms after render

    return () => {
      clearTimeout(timeoutId);
      const letters = housefullContainer.querySelectorAll(".housefull-letter");
      gsap.killTweensOf([housefullContainer, saleText, dateText, letters]);
    };
  }, [hasData]);

  // Product rotation animation
  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  // Reset product index when featuredProducts change
  useEffect(() => {
    if (featuredProducts.length > 0 && currentProductIndex >= featuredProducts.length) {
      setCurrentProductIndex(0);
    }
  }, [featuredProducts.length, currentProductIndex]);

  // Animate product change
  useEffect(() => {
    const elements = [
      priceContainerRef.current,
      productNameRef.current,
      productImageRef.current,
    ];
    if (elements.some((el) => !el)) return;

    const tween = gsap.to(elements, {
      opacity: 0,
      x: -30,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        const currentElements = [
          priceContainerRef.current,
          productNameRef.current,
          productImageRef.current,
        ];
        if (currentElements.some((el) => !el)) return;

        gsap.set(currentElements, {
          x: 30,
          opacity: 0,
        });

        gsap.to(currentElements, {
          opacity: 1,
          x: 0,
          duration: 0.4,
          ease: "power2.out",
        });
      },
    });

    return () => {
      tween.kill();
    };
  }, [currentProductIndex]);

  const currentProduct = featuredProducts.length > 0 ? featuredProducts[currentProductIndex] : null;

  // Show minimal loading state - render faster
  if (loading) {
    return (
      <div
        className="relative"
        style={{
          background: `linear-gradient(to bottom, ${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${theme.primary[3]}, ${theme.primary[3]})`,
          paddingTop: "12px",
          paddingBottom: "0px",
          marginTop: 0,
          minHeight: "200px"
        }}>
        <div className="h-[200px] w-full bg-transparent animate-pulse rounded-lg mx-0 mt-4" />
      </div>
    );
  }

  // Show "No active promotions" only if there are no cards AND no products
  if (!hasData || (categoryCards.length === 0 && featuredProducts.length === 0)) {
    return (
      <div className="text-center py-6 text-neutral-400 text-sm">
        No active promotions
      </div>
    );
  }

  // If no featured products but we have category cards, use a fallback product
  const displayProduct = currentProduct || {
    id: 'fallback',
    name: 'Special Offers',
    originalPrice: 999,
    discountedPrice: 499,
    imageUrl: undefined,
  };

  // Calculate prices from actual product data using utility
  const { displayPrice, mrp } = calculateProductPrice(displayProduct);

  // Fallback prices if product data is incomplete
  const finalDiscountedPrice = displayPrice > 0 ? displayPrice : (Number.isFinite(displayProduct.discountedPrice) ? displayProduct.discountedPrice : 499);
  const finalOriginalPrice = mrp > 0 ? mrp : (Number.isFinite(displayProduct.originalPrice) ? displayProduct.originalPrice : 999);

  // Ensure prices are valid numbers
  const safeOriginalPrice = Number.isFinite(finalOriginalPrice) ? Math.round(finalOriginalPrice) : 999;
  const safeDiscountedPrice = Number.isFinite(finalDiscountedPrice) ? Math.round(finalDiscountedPrice) : 499;

  // Helper function to handle product navigation
  const handleProductClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Get product ID - handle both string and ObjectId formats
    const productId = displayProduct?.id || displayProduct?._id;

    if (productId && productId !== 'fallback') {
      // Convert to string if it's an object
      const idString = typeof productId === 'string' ? productId : String(productId);
      if (idString && idString !== 'fallback' && idString.length > 0) {
        navigate(`/product/${idString}`);
      }
    }
  };

  return (
    <div
      className="relative"
      style={{
        background: `linear-gradient(to bottom, ${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${theme.primary[3]}, ${theme.primary[3]})`,
        paddingTop: "12px",
        paddingBottom: "0px",
        marginTop: 0,
      }}>
      {/* 🌊 PREMIUM MAGAZINE-STYLE CATEGORY SECTION (Redesigned Top List) */}
      <div
        id="category-section"
        className="w-full py-[80px] px-5 md:px-[80px] relative z-10"
        style={{ background: 'transparent' }}
      >
        {/* Header */}
        <div className="max-w-[1280px] mx-auto mb-[60px] text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-[#1CA7C7]/20 text-[#6FD3FF] text-[12px] font-black tracking-[0.2em] uppercase mb-4 border border-[#1CA7C7]/30 backdrop-blur-md"
          >
            Seafood Selection
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white text-4xl md:text-[56px] font-black leading-tight tracking-tighter mb-4"
            style={{ textShadow: '0 0 20px rgba(28,167,199,0.3)' }}
          >
            Our Top <span className="text-[#1CA7C7]">Categories</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#BEEFFF]/70 text-base md:text-xl max-w-[650px] font-medium"
          >
            Explore our curated selection of ultra-fresh fish, delivered straight from the deep waters to your table.
          </motion.p>
        </div>

        {/* Grid Container */}
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[40px]">
          {[
            {
              id: "aqua",
              name: "Aqua Fish",
              description: "Natural pond Rohu & Catla. Responsibly bred for pristine quality and taste.",
              image: "/images/rohu_hd.png",
              slug: "aqua",
              accent: "#1CA7C7",
              panelBg: "linear-gradient(135deg, rgba(28,167,199,0.15), rgba(11,60,93,0.4))"
            },
            {
              id: "marin",
              name: "Marin Fish",
              description: "Deep sea Bluefin & Tuna. Captured using sustainable methods for premium freshness.",
              image: "/images/bluefin_tuna.png",
              slug: "marin",
              accent: "#6FD3FF",
              panelBg: "linear-gradient(135deg, rgba(111,211,255,0.15), rgba(7,47,74,0.4))"
            },
            {
              id: "bengali",
              name: "Bengali Fish",
              description: "Premium Hilsa & Market favorites. The heartbeat of every traditional kitchen.",
              image: "/images/bengali_fish.png",
              slug: "bengali",
              accent: "#BEEFFF",
              panelBg: "linear-gradient(135deg, rgba(190,239,255,0.15), rgba(14,58,109,0.4))"
            }
          ].map((category, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -12 }}
              onClick={() => navigate(`/?tab=${category.slug}`)}
              className="water-card water-shimmer-border rounded-[32px] p-6 flex flex-col relative group cursor-pointer h-full"
            >
              {/* Corner Accent Badge */}
              <div className="absolute top-8 right-8 z-30">
                <div className="w-3 h-3 rounded-full shadow-[0_0_15px_rgba(28,167,199,0.8)] animate-pulse" style={{ backgroundColor: category.accent }}></div>
              </div>

              {/* Image Panel Section */}
              <div
                className="w-full h-[280px] rounded-[24px] relative overflow-hidden flex items-center justify-center p-8 mb-8 transition-transform duration-700 group-hover:rotate-1 border border-white/10"
                style={{ background: category.panelBg }}
              >
                {/* Decorative Elements */}
                <div className="absolute top-4 left-4 w-16 h-1 bg-white/10 rounded-full rotate-45"></div>

                {/* Rotated Image Card Effect */}
                <motion.div
                  className="w-full h-full relative z-10"
                  animate={{
                    rotate: [-3, 2, -3],
                    y: [0, -8, 0]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-contain filter drop-shadow(0 20px 40px rgba(0,0,0,0.5)) transition-transform duration-700 group-hover:scale-110"
                  />
                </motion.div>

                {/* Glass Highlight */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
              </div>

              {/* Content Section */}
              <div className="px-2 pb-2">
                <h3 className="text-white text-[28px] font-black leading-tight mb-3 transition-colors group-hover:text-[#1CA7C7]" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {category.name}
                </h3>
                <p className="text-[#BEEFFF] text-[16px] font-medium leading-relaxed mb-8 h-[72px] line-clamp-3 opacity-90">
                  {category.description}
                </p>

                {/* Explore Button */}
                <div className="flex items-center gap-3 group/btn">
                  <span className="text-[16px] font-black text-[#6FD3FF] tracking-[0.2em] uppercase transition-all group-hover/btn:text-white" style={{ textShadow: '0 0 10px rgba(111,211,255,0.4)' }}>
                    EXPLORE DEPTH
                  </span>
                  <motion.div
                    className="flex items-center"
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6FD3FF"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-colors group-hover/btn:stroke-white"
                    >
                      <path d="M5 12h14m-7-7 7 7-7 7" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
