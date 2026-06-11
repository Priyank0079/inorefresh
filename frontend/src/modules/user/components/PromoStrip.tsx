import { useLayoutEffect, useRef, useState, useEffect, useCallback, MouseEvent } from "react";
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
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const toggleDescription = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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
          60 * 1000
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
            if (lowerTitle.includes('marin')) fallbackImage = '/images/marine_fish_banner.webp';
            else if (lowerTitle.includes('aqua')) fallbackImage = '/images/aqua_fish_banner.webp';
            else if (lowerTitle.includes('bengali') || lowerTitle.includes('bangali')) fallbackImage = '/images/bengali_fish_banner.webp';

            const hdImageUrl = card.imageUrl || fallbackImage || '/images/marine_fish_banner.webp';

            return {
              ...card,
              imageUrl: hdImageUrl,
              fallbackImageUrl: fallbackImage || '/images/top_list_marin_fish_trans.webp'
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
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-block px-4 py-1.5 rounded-full bg-[#003B5C]/10 text-[#003B5C] text-[10px] md:text-[12px] font-black tracking-[0.2em] uppercase mb-3 md:mb-4 border border-[#003B5C]/20 backdrop-blur-md">
            Seafood Selection
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#072F4A] text-[28px] md:text-[34px] font-[800] leading-tight mb-2 uppercase tracking-tight"
          >
            Our Top <span className="text-[#1CA7C7]">Categories</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#0B3C5D]/80 text-[14px] md:text-[16px] max-w-[650px] leading-relaxed font-semibold italic px-2 md:px-0"
          >
            Explore our curated selection of ultra-fresh fish, delivered straight from the deep waters to your table.
          </motion.p>
        </div>

        {/* Desktop Layout - Step 8 */}
        <div className="max-w-[1280px] mx-auto hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-[32px]">
          {(categoryCards.length > 0 ? categoryCards.slice(0, 3) : []).map((category: any, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -12, boxShadow: '0 30px 60px rgba(0,45,74,0.25)' }}
              onClick={() => navigate(category.slug ? `/?tab=${category.slug}` : `/category/${category.categoryId || category.id}`)}
              className="bg-white rounded-[32px] flex flex-col relative transition-all duration-300 cursor-pointer overflow-hidden border border-[#BEEFFF]/30 group"
              style={{ boxShadow: '0 20px 45px rgba(0,45,74,0.1)' }}
            >
              {/* Category Image Area - Now Full Width at Top */}
              <div className="w-full h-[240px] overflow-hidden relative">
                <img
                  src={category.imageUrl}
                  alt={category.title}
                  className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/top_list_marin_fish_trans.webp';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent opacity-60 pointer-events-none" />
                
              </div>

              {/* Card Content with Padding */}
              <div className="p-8 pt-6 flex flex-col flex-1 bg-white">
                <div className="h-[64px] overflow-hidden">
                  <h3 className="text-[24px] font-[900] text-[#002D4A] tracking-tight uppercase group-hover:text-[#1CA7C7] transition-colors duration-300 leading-tight line-clamp-2">
                    {category.title}
                  </h3>
                </div>
                <p className={`text-[16px] text-[#003B5C]/70 mt-[8px] leading-relaxed font-medium ${expandedDescriptions.has(category.id) ? '' : 'line-clamp-1'}`}>
                  {category.description || `Explore our premium ${category.title} range for the best quality.`}
                </p>
                <button
                  onClick={(e) => toggleDescription(category.id, e)}
                  className="text-[#1CA7C7] text-[13px] font-semibold mt-1 text-left hover:underline"
                >
                  {expandedDescriptions.has(category.id) ? 'View less' : 'View more'}
                </button>

                <div className="mt-auto pt-6">
                  <button className="bg-[#072F4A] hover:bg-[#003B5C] text-white text-[16px] font-[800] py-[14px] px-[20px] rounded-[18px] flex items-center justify-center gap-[10px] transition-all w-full shadow-xl shadow-[#072F4A]/25 group-hover:translate-y-[-2px] group-active:scale-95">
                    Explore Now <span>→</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Layout (Sliding Cards) - Step 9 & 10 */}
        <div className="flex md:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-0 pb-[30px] px-0 scroll-smooth">
          {(categoryCards.length > 0 ? categoryCards.slice(0, 3) : []).map((category: any) => (
            <div key={category.id} className="flex-shrink-0 w-full px-5 snap-center">
              <motion.div
                onClick={() => navigate(category.slug ? `/?tab=${category.slug}` : `/category/${category.categoryId || category.id}`)}
                className="bg-white rounded-[32px] flex flex-col relative transition-all duration-300 overflow-hidden border border-[#BEEFFF]/30 h-[460px]"
                style={{ boxShadow: '0 12px 30px rgba(0,45,74,0.12)' }}
              >
                {/* Full Width Image at Top */}
                <div className="w-full h-[200px] overflow-hidden relative">
                  <img
                    src={category.imageUrl}
                    alt={category.title}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/top_list_marin_fish_trans.webp';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent opacity-40 pointer-events-none" />
                  
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1 overflow-hidden">
                  <h3 className="text-[22px] font-[800] text-[#002D4A] uppercase tracking-tight min-h-[56px]">
                    {category.title}
                  </h3>
                  <p className={`text-[14px] text-[#003B5C]/70 mt-[6px] leading-relaxed font-medium ${expandedDescriptions.has(category.id) ? '' : 'line-clamp-1'}`}>
                    {category.description || `Explore our premium ${category.title} range.`}
                  </p>
                  <button
                    onClick={(e) => toggleDescription(category.id, e)}
                    className="text-[#1CA7C7] text-[13px] font-semibold mt-1 text-left hover:underline"
                  >
                    {expandedDescriptions.has(category.id) ? 'View less' : 'View more'}
                  </button>
                  
                  <div className="mt-auto pt-5">
                    <button className="bg-[#072F4A] active:bg-[#0B3C5D] text-white text-[15px] font-bold py-[14px] px-[16px] rounded-[16px] flex items-center justify-center gap-[8px] w-full shadow-lg shadow-[#072F4A]/20">
                      Explore <span>→</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
