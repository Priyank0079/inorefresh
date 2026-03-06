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
    setTimeout(async () => {
      const imagesMap: Record<string, string[]> = {};
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
              console.error(`Error fetching subcategories for category ${categoryId}:`, error);
            }
          })
        );
        if (i + batchSize < cards.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      setSubcategoryImagesMap(imagesMap);
    }, 300);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const cacheKey = `home-content-${activeTab || 'all'}`;
      const cachedData = apiCache.getSync(cacheKey);
      if (!cachedData) {
        setLoading(true);
      }
      try {
        const response = await getHomeContent(
          activeTab,
          location?.latitude,
          location?.longitude,
          true,
          5 * 60 * 1000
        );
        setCurrentProductIndex(0);
        let fetchedCards: PromoCard[] = [];
        let fetchedProducts: any[] = [];
        let newHeadingText = theme.bannerText;
        let newSaleTextValue = theme.saleText;
        let newDateRange = "";

        if (response.success && response.data) {
          if (response.data.promoStrip && response.data.promoStrip.isActive) {
            const promoStrip = response.data.promoStrip;
            newHeadingText = promoStrip.heading || newHeadingText;
            newSaleTextValue = promoStrip.saleText || newSaleTextValue;
            if (promoStrip.crazyDealsTitle) {
              setCrazyDealsTitle(promoStrip.crazyDealsTitle);
            } else {
              setCrazyDealsTitle("CRAZY DEALS");
            }
            if (promoStrip.startDate && promoStrip.endDate) {
              const start = new Date(promoStrip.startDate);
              const end = new Date(promoStrip.endDate);
              newDateRange = `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}`;
            }
            if (promoStrip.categoryCards && promoStrip.categoryCards.length > 0) {
              fetchedCards = promoStrip.categoryCards
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                .map((card: any) => {
                  const category = typeof card.categoryId === 'object' ? card.categoryId : null;
                  return {
                    id: card._id || card.categoryId?._id || card.categoryId,
                    badge: card.badge || `Up to ${card.discountPercentage || 0}% OFF`,
                    title: card.title || category?.name || "",
                    categoryId: category?._id || card.categoryId,
                    slug: category?.slug || card.categoryId,
                    imageUrl: category?.image,
                    bgColor: "bg-yellow-50",
                  };
                });
            }
            if (promoStrip.featuredProducts && promoStrip.featuredProducts.length > 0) {
              fetchedProducts = promoStrip.featuredProducts.map((p: any) => {
                const product = typeof p === 'object' ? p : null;
                const price = Number(product?.price) || 0;
                const mrp = Number(product?.mrp) || Number(product?.compareAtPrice) || 0;
                const originalPrice = mrp > 0 ? mrp : (price > 0 ? Math.round(price * 1.2) : 999);
                const discountedPrice = price > 0 ? price : 499;
                const imageUrl = product?.mainImage || product?.mainImageUrl || product?.image || product?.imageUrl || null;
                const productName = product?.productName || product?.name || "Product";
                return {
                  id: product?._id || p,
                  _id: product?._id || p,
                  name: productName,
                  productName: productName,
                  price: price,
                  mrp: mrp,
                  originalPrice: isNaN(originalPrice) ? 999 : originalPrice,
                  discountedPrice: isNaN(discountedPrice) ? 499 : discountedPrice,
                  imageUrl: imageUrl,
                };
              });
            }
          }
          else if (response.data.promoCards && response.data.promoCards.length > 0) {
            fetchedCards = response.data.promoCards;
          }
          else if (response.data.categories && response.data.categories.length > 0) {
            fetchedCards = response.data.categories.slice(0, 4).map((c: any) => ({
              id: c._id || c.id,
              badge: "Up to 50% OFF",
              title: c.name,
              categoryId: c.slug || c._id,
              bgColor: c.color || "bg-yellow-50",
            }));
          }
          if (fetchedProducts.length === 0 && response.data.bestsellers && response.data.bestsellers.length > 0) {
            fetchedProducts = response.data.bestsellers.map((p: any) => {
              const price = Number(p.price) || 0;
              const mrp = Number(p.mrp) || 0;
              const originalPrice = mrp > 0 ? mrp : (price > 0 ? Math.round(price * 1.2) : 999);
              const discountedPrice = price > 0 ? price : 499;
              const imageUrl = p.mainImage || p.mainImageUrl || p.image || p.imageUrl || null;
              const productName = p.productName || p.name || "Product";
              return {
                id: p._id,
                _id: p._id,
                name: productName,
                productName: productName,
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
        if (!response.data?.promoStrip || !response.data.promoStrip.isActive) {
          setCrazyDealsTitle("CRAZY DEALS");
        }
        setHasData(fetchedCards.length > 0 || fetchedProducts.length > 0);
        if (fetchedCards.length > 0) {
          fetchSubcategoryImages(fetchedCards);
        }
      } catch (error) {
        console.error("Error fetching home content for PromoStrip:", error);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, theme.bannerText, theme.saleText, location?.latitude, location?.longitude, fetchSubcategoryImages]);

  useEffect(() => {
    setCurrentProductIndex(0);
  }, [activeTab, featuredProducts.length]);

  useLayoutEffect(() => {
    if (!hasData) return;
    const container = containerRef.current;
    if (!container) return;
    let ctx: gsap.Context | null = null;
    const timeoutId = setTimeout(() => {
      ctx = gsap.context(() => {
        const cards = container.querySelectorAll(".promo-card");
        if (cards.length > 0) {
          gsap.fromTo(cards, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" });
        }
      }, container);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      if (ctx) ctx.revert();
    };
  }, [hasData]);

  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const interval = setInterval(() => setCurrentProductIndex((prev) => (prev + 1) % featuredProducts.length), 3000);
    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  const displayProduct = featuredProducts[currentProductIndex] || { id: 'fallback', name: 'Special Offers', originalPrice: 999, discountedPrice: 499 };
  const { displayPrice, mrp } = calculateProductPrice(displayProduct);
  const safeOriginalPrice = Number.isFinite(mrp) ? Math.round(mrp) : 999;
  const safeDiscountedPrice = Number.isFinite(displayPrice) ? Math.round(displayPrice) : 499;

  return (
    <div
      className="relative"
      style={{
        background: `linear-gradient(to bottom, ${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${theme.primary[3]}, ${theme.primary[3]})`,
        paddingTop: "12px",
        paddingBottom: "0px",
        marginTop: 0,
      }}>
      <div id="category-section" className="w-full py-[80px] px-5 md:px-[80px] relative z-10" style={{ background: 'transparent' }}>
        <div className="max-w-[1280px] mx-auto mb-[60px] text-center md:text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-block px-4 py-1.5 rounded-full bg-[#1CA7C7]/20 text-[#6FD3FF] text-[12px] font-black tracking-[0.2em] uppercase mb-4 border border-[#1CA7C7]/30 backdrop-blur-md">
            Seafood Selection
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-white text-4xl md:text-[56px] font-black leading-tight tracking-tighter mb-4" style={{ textShadow: '0 0 20px rgba(28,167,199,0.3)' }}>
            Our Top <span className="text-[#1CA7C7]">Categories</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-[#BEEFFF]/70 text-base md:text-xl max-w-[650px] font-medium">
            Explore our curated selection of ultra-fresh fish, delivered straight from the deep waters to your table.
          </motion.p>
        </div>

        <div className="max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[40px]">
          {(categoryCards.length > 0 ? categoryCards : [
            { id: "aqua", title: "Aqua Fish", badge: "Premium", description: "Natural pond Rohu & Catla. Responsibly bred for pristine quality and taste.", imageUrl: "/images/top_list_aqua_fish_trans.png", slug: "aqua", bgColor: "transparent" },
            { id: "marin", title: "Marin Fish", badge: "Fresh", description: "Deep sea Bluefin & Tuna. Captured using sustainable methods for premium freshness.", imageUrl: "/images/top_list_marin_fish_trans.png", slug: "marin", bgColor: "transparent" },
            { id: "bengali", title: "Bengali Fish", badge: "Tradition", description: "Premium Hilsa & Market favorites. The heartbeat of every traditional kitchen.", imageUrl: "/images/top_list_bengali_fish_trans.png", slug: "bengali", bgColor: "transparent" }
          ]).map((category: any, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -12 }}
              onClick={() => navigate(category.slug ? `/?tab=${category.slug}` : `/category/${category.categoryId || category.id}`)}
              className="water-card water-shimmer-border rounded-[32px] p-6 flex flex-col relative group cursor-pointer h-full"
            >
              <div className="absolute top-8 right-8 z-30">
                <div className="w-3 h-3 rounded-full shadow-[0_0_15px_rgba(28,167,199,0.8)] animate-pulse" style={{ backgroundColor: '#6FD3FF' }}></div>
              </div>

              <div className="w-full h-[280px] rounded-[24px] relative overflow-hidden flex items-center justify-center p-8 mb-8 transition-transform duration-700 group-hover:rotate-1 border border-white/10" style={{ background: 'transparent' }}>
                <motion.div
                  className="w-full h-full relative z-10 flex items-center justify-center"
                  animate={{ x: [-12, 12, -12], y: [0, -10, 0], rotate: [-3, 3, -3], scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.title}
                      className="w-full h-full object-contain filter drop-shadow(0 20px 40px rgba(0,0,0,0.5)) transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="text-6xl font-black text-white/20 select-none">{category.title.charAt(0)}</div>
                  )}
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
              </div>

              <div className="px-2 pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#6FD3FF] text-[10px] font-bold uppercase tracking-wider">{category.badge}</span>
                </div>
                <h3 className="text-white text-[28px] font-black leading-tight mb-3 transition-colors group-hover:text-[#1CA7C7]" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {category.title}
                </h3>
                <p className="text-[#DDF5FF] text-[16px] font-medium leading-relaxed mb-8 h-[72px] line-clamp-3 opacity-100">
                  {category.description || `Explore our premium ${category.title} range for the best quality and freshness.`}
                </p>
                <div className="flex items-center gap-3 group/btn">
                  <span className="text-[16px] font-black text-[#9FE8FF] tracking-[0.2em] uppercase transition-all group-hover/btn:text-white" style={{ textShadow: '0 0 10px rgba(111,211,255,0.4)' }}>
                    EXPLORE DEPTH
                  </span>
                  <motion.div className="flex items-center" animate={{ x: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6FD3FF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors group-hover/btn:stroke-white">
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
