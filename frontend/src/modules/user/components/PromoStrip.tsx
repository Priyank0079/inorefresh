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
                    imageUrl: category?.image || category?.imageUrl || card?.image || card?.imageUrl,
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
              imageUrl: c.image || c.imageUrl,
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
          // Pre-verify image availability or set fallbacks
          const validatedCards = fetchedCards.map(card => {
            const lowerTitle = (card.title || "").toLowerCase();
            let fallbackImage = "";
            if (lowerTitle.includes('marin')) fallbackImage = '/images/top_list_marin_fish_trans.png';
            else if (lowerTitle.includes('aqua')) fallbackImage = '/images/top_list_aqua_fish_trans.png';
            else if (lowerTitle.includes('bengali') || lowerTitle.includes('bangali')) fallbackImage = '/images/top_list_bengali_fish_trans.png';

            const hdImageUrl = card.imageUrl || fallbackImage || '/images/top_list_marin_fish_trans.png';

            return {
              ...card,
              imageUrl: hdImageUrl,
              fallbackImageUrl: fallbackImage || '/images/top_list_marin_fish_trans.png'
            };
          });
          setCategoryCards(validatedCards);
          fetchSubcategoryImages(validatedCards);
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
      <div id="category-section" className="w-full pt-[30px] pb-[50px] px-5 md:px-[80px] relative z-10" style={{ background: 'transparent' }}>
        <div className="max-w-[1280px] mx-auto mb-[20px] px-4 md:px-0 text-center md:text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-block px-4 py-1.5 rounded-full bg-[#003B5C]/10 text-[#003B5C] text-[12px] font-black tracking-[0.2em] uppercase mb-4 border border-[#003B5C]/20 backdrop-blur-md">
            Seafood Selection
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#072F4A] text-[34px] font-[800] leading-tight mb-2 uppercase tracking-tight"
          >
            Our Top <span className="text-[#1CA7C7]">Categories</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#0B3C5D]/80 text-[16px] max-w-[650px] leading-relaxed font-semibold italic"
          >
            Explore our curated selection of ultra-fresh fish, delivered straight from the deep waters to your table.
          </motion.p>
        </div>

        {/* Desktop Layout - Step 8 */}
        <div className="max-w-[1280px] mx-auto hidden md:grid md:grid-cols-2 gap-[24px]">
          {(categoryCards.length > 0 ? categoryCards : [
            { id: "aqua", title: "Aqua Fish", badge: "UP TO 55% OFF", description: "Natural pond Rohu & Catla. Responsibly bred for pristine quality and taste.", imageUrl: "/images/top_list_aqua_fish_trans.png", slug: "aqua", bgColor: "transparent" },
            { id: "marin", title: "Marine Fish", badge: "UP TO 45% OFF", description: "Deep sea Bluefin & Tuna. Captured using sustainable methods for premium freshness.", imageUrl: "/images/top_list_marin_fish_trans.png", slug: "marin", bgColor: "transparent" },
            { id: "bengali", title: "Bengali Fish", badge: "UP TO 35% OFF", description: "Premium Hilsa & Market favorites. The heartbeat of every traditional kitchen.", imageUrl: "/images/top_list_bengali_fish_trans.png", slug: "bengali", bgColor: "transparent" }
          ]).map((category: any, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -12, boxShadow: '0 25px 50px rgba(0,45,74,0.2)' }}
              onClick={() => navigate(category.slug ? `/?tab=${category.slug}` : `/category/${category.categoryId || category.id}`)}
              className="bg-gradient-to-b from-white to-[#E0F2FE] rounded-[32px] p-8 flex flex-col relative transition-all duration-300 cursor-pointer min-h-[400px] justify-between border border-[#BEEFFF]"
              style={{ boxShadow: '0 15px 35px rgba(0,45,74,0.12)' }}
            >
              <div className="flex flex-col">
                {/* Step 6 - Discount Badge */}
                <div className="absolute top-[20px] left-[20px] z-20 bg-[#002D4A] text-white text-[12px] px-[12px] py-[5px] rounded-[10px] font-bold tracking-wide">
                  {category.badge}
                </div>

                {/* Step 3 - Category Image Area */}
                <div className="w-full h-[200px] rounded-[24px] overflow-hidden mb-4 bg-white/50 border border-[#BEEFFF]/30 flex items-center justify-center">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (category.fallbackImageUrl && target.src !== window.location.origin + category.fallbackImageUrl) {
                          target.src = category.fallbackImageUrl;
                        } else if (target.src !== window.location.origin + '/images/top_list_marin_fish_trans.png') {
                          target.src = '/images/top_list_marin_fish_trans.png';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#BEEFFF]">
                      {category.title.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Step 4 & 5 - Title and Description */}
                <h3 className="text-[22px] font-[800] text-[#002D4A] mt-[4px] tracking-tight uppercase">
                  {category.title}
                </h3>
                <p className="text-[15px] text-[#003B5C]/70 mt-[6px] leading-[1.5] line-clamp-2 font-medium">
                  {category.description || `Explore our premium ${category.title} range for the best quality.`}
                </p>
              </div>

              {/* Step 7 - Explore Button */}
              <button className="mt-[18px] bg-[#072F4A] hover:bg-[#0B3C5D] text-white text-[15px] font-bold py-[12px] px-[16px] rounded-[14px] flex items-center justify-center gap-[8px] transition-all w-full shadow-lg shadow-[#072F4A]/30">
                Explore <span>→</span>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Mobile Layout (Sliding Cards) - Step 9 & 10 */}
        <div className="flex md:hidden overflow-x-auto scrollbar-hide snap-x mandatory gap-[16px] pb-[20px] px-8 scroll-smooth">
          {(categoryCards.length > 0 ? categoryCards : [
            { id: "aqua", title: "Aqua Fish", badge: "UP TO 55% OFF", description: "Natural pond Rohu & Catla. Responsibly bred.", imageUrl: "/images/top_list_aqua_fish_trans.png", slug: "aqua" },
            { id: "marin", title: "Marine Fish", badge: "UP TO 45% OFF", description: "Deep sea Bluefin & Tuna. Sustainable methods.", imageUrl: "/images/top_list_marin_fish_trans.png", slug: "marin" },
            { id: "bengali", title: "Bengali Fish", badge: "UP TO 35% OFF", description: "Premium Hilsa & Market favorites.", imageUrl: "/images/top_list_bengali_fish_trans.png", slug: "bengali" }
          ]).map((category: any) => (
            <motion.div
              key={category.id}
              onClick={() => navigate(category.slug ? `/?tab=${category.slug}` : `/category/${category.categoryId || category.id}`)}
              className="flex-shrink-0 min-w-[72%] snap-center bg-gradient-to-b from-white to-[#E0F2FE] rounded-[28px] p-6 flex flex-col relative transition-all duration-300 min-h-[380px] justify-between border border-[#BEEFFF]"
              style={{ boxShadow: '0 12px 30px rgba(0,45,74,0.12)' }}
            >
              <div className="flex flex-col">
                <div className="absolute top-[16px] left-[16px] z-20 bg-[#002D4A] text-white text-[10px] px-[10px] py-[4px] rounded-[8px] font-bold">
                  {category.badge}
                </div>
                <div className="w-full h-[200px] rounded-[22px] overflow-hidden mb-4 bg-white/50 border border-[#BEEFFF]/30 flex items-center justify-center">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const lowerTitle = category.title.toLowerCase();
                        let fallback = '/images/top_list_marin_fish_trans.png';
                        if (lowerTitle.includes('aqua')) fallback = '/images/top_list_aqua_fish_trans.png';
                        else if (lowerTitle.includes('bengali') || lowerTitle.includes('bangali')) fallback = '/images/top_list_bengali_fish_trans.png';

                        if (target.src !== window.location.origin + fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#BEEFFF]">
                      {category.title.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="text-[20px] font-[800] text-[#002D4A] mt-[4px] uppercase tracking-tight">
                  {category.title}
                </h3>
                <p className="text-[14px] text-[#003B5C]/70 mt-[4px] leading-[1.5] line-clamp-2 font-medium">
                  {category.description || `Explore our premium ${category.title} range.`}
                </p>
              </div>
              <button className="mt-[16px] bg-[#072F4A] active:bg-[#0B3C5D] text-white text-[14px] font-bold py-[12px] px-[14px] rounded-[12px] flex items-center justify-center gap-[6px] w-full shadow-lg shadow-[#072F4A]/25">
                Explore <span>→</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
