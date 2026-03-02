import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import { useLocation } from "../../hooks/useLocation";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { LOCAL_FISH_PRODUCTS } from "../../constants/products";
import { Product } from "../../types/domain";
import { motion, AnimatePresence } from "framer-motion";
import HomeHero from "./components/HomeHero";
import PromoStrip from "./components/PromoStrip";
import LowestPricesEver from "./components/LowestPricesEver";
import CategoryTileSection from "./components/CategoryTileSection";
import FeaturedThisWeek from "./components/FeaturedThisWeek";
import FishLoader from "../../components/FishLoader";
import { getHomeContent } from "../../services/api/customerHomeService";
import { getHeaderCategoriesPublic } from "../../services/api/headerCategoryService";
import { useLoading } from "../../context/LoadingContext";
import PageLoader from "../../components/PageLoader";

import { useThemeContext } from "../../context/ThemeContext";

export default function Home() {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { location } = useLocation();
  const { cart, addToCart, updateQuantity } = useCart();
  const { showToast } = useToast();
  const { activeCategory, setActiveCategory } = useThemeContext();
  const { startRouteLoading, stopRouteLoading } = useLoading();
  const activeTab = activeCategory; // mapping for existing code compatibility
  const setActiveTab = setActiveCategory;
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollHandledRef = useRef(false);
  const SCROLL_POSITION_KEY = 'home-scroll-position';

  // State for dynamic data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<any>({
    bestsellers: [],
    categories: [],
    homeSections: [], // Dynamic sections created by admin
    shops: [],
    promoBanners: [],
    trending: [],
    cookingIdeas: [],
  });

  const [products, setProducts] = useState<any[]>([]);
  const [isTabLoading, setIsTabLoading] = useState(false);

  // Simulation of tab switch loading (premium feel)
  useEffect(() => {
    setIsTabLoading(true);
    const timer = setTimeout(() => {
      setIsTabLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Sync React Router Tab Parameter to Global App State
  useEffect(() => {
    const searchParams = new URLSearchParams(routerLocation.search);
    const tabParam = searchParams.get('tab');

    if (tabParam && ['aqua', 'marin', 'bengali', 'all'].includes(tabParam)) {
      setActiveTab(tabParam);

      // Simple auto-scroll to products if a category is selected via URL
      if (tabParam !== 'all') {
        const timer = setTimeout(() => {
          const section = document.getElementById('lowest-prices-section');
          if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [routerLocation.search, setActiveTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getHomeContent(
          undefined,
          location?.latitude,
          location?.longitude
        );
        setHomeData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching home content:", err);
        setError("Failed to load content. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location?.latitude, location?.longitude]);

  // Preload common category data for snappier navigation
  useEffect(() => {
    const preloadHeaderCategories = async () => {
      try {
        const slugsToPreload = ['aqua', 'marin', 'bengali'];
        const batchSize = 2;
        for (let i = 0; i < slugsToPreload.length; i += batchSize) {
          const batch = slugsToPreload.slice(i, i + batchSize);
          await Promise.all(
            batch.map(slug =>
              getHomeContent(
                slug,
                location?.latitude,
                location?.longitude,
                true,
                5 * 60 * 1000,
                true
              ).catch(err => {
                console.debug(`Failed to preload data for ${slug}:`, err);
              })
            )
          );
          if (i + batchSize < slugsToPreload.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } catch (error) {
        console.debug("Failed to preload header categories:", error);
      }
    };

    preloadHeaderCategories();
  }, [location?.latitude, location?.longitude]);

  // Restore scroll position when returning to this page
  useEffect(() => {
    // Only restore scroll after data has loaded
    if (!loading && homeData.shops) {
      if (scrollHandledRef.current) return;
      scrollHandledRef.current = true;

      const savedScrollPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedScrollPosition) {
        const scrollY = parseInt(savedScrollPosition, 10);

        const performScroll = () => {
          const mainElement = document.querySelector('main');
          if (mainElement) {
            mainElement.scrollTop = scrollY;
          }
          window.scrollTo(0, scrollY);
        };

        requestAnimationFrame(() => {
          performScroll();
          requestAnimationFrame(() => {
            performScroll();
            setTimeout(performScroll, 100);
            setTimeout(performScroll, 300);
          });
        });

        setTimeout(() => {
          sessionStorage.removeItem(SCROLL_POSITION_KEY);
        }, 1000);
      } else {
        const performReset = () => {
          const mainElement = document.querySelector('main');
          if (mainElement) {
            mainElement.scrollTop = 0;
          }
          window.scrollTo(0, 0);
        };
        requestAnimationFrame(performReset);
        setTimeout(performReset, 100);
      }
    }
  }, [loading, homeData.shops]);

  const saveScrollPosition = () => {
    const mainElement = document.querySelector('main');
    const scrollY = mainElement ? mainElement.scrollTop : window.scrollY;
    if (scrollY > 0) {
      sessionStorage.setItem(SCROLL_POSITION_KEY, scrollY.toString());
    }
  };

  // Listeners to save scroll position
  useEffect(() => {
    const handleNavigationEvent = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button') || target.closest('[role="button"]') || target.closest('.cursor-pointer')) {
        saveScrollPosition();
      }
    };

    window.addEventListener('click', handleNavigationEvent, { capture: true });
    window.addEventListener('touchstart', handleNavigationEvent, { capture: true, passive: true });
    return () => {
      window.removeEventListener('click', handleNavigationEvent, { capture: true });
      window.removeEventListener('touchstart', handleNavigationEvent, { capture: true });
    };
  }, []);

  const getFilteredProducts = (tabId: string) => {
    if (tabId === "all") {
      return LOCAL_FISH_PRODUCTS;
    }
    return LOCAL_FISH_PRODUCTS.filter((p) => p.category === tabId);
  };

  const filteredProducts = useMemo(
    () => getFilteredProducts(activeTab),
    [activeTab]
  );

  if (loading && !products.length) {
    return <PageLoader />;
  }

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20 md:pb-0" ref={contentRef}>
      {/* Hero Header with Gradient and Tabs */}
      <HomeHero activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'all' && (
        <>
          {/* Promo Strip */}
          <PromoStrip activeTab={activeTab} />

          {/* LOWEST PRICES EVER Section */}
          <LowestPricesEver activeTab={activeTab} products={homeData.lowestPrices} />
        </>
      )}

      {/* Main content - Premium Products Grid */}
      <div className="bg-neutral-50 pt-6 space-y-5 md:space-y-8 md:pt-8 w-full">
        <div className="px-4 pb-20 md:px-6 lg:px-8 w-full max-w-[1280px] mx-auto overflow-x-hidden">
          {/* Framer Motion Wrapper for Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.20, // 200ms fade in as requested
                  ease: "easeOut"
                }
              }}
              exit={{
                opacity: 0,
                y: 0,
                transition: {
                  duration: 0.15, // 150ms fade out as requested
                  ease: "easeIn"
                }
              }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-5 w-full"
            >
              {filteredProducts.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[#003366] mb-1">No fish found</h3>
                  <p className="text-neutral-500 max-w-xs">We couldn't find any products in the {activeTab} category right now.</p>
                </div>
              ) : (
                filteredProducts.map((type, i) => {
                  const priceValue = type.price;
                  const formattedPrice = `₹${priceValue}`;
                  const pseudoRandomRating = (type.rating || 4.5).toFixed(1);

                  // Find if item is in cart
                  const cartItem = cart.items.find(item => (item.product.id || (item.product as any)._id) === type.id);
                  const quantity = cartItem?.quantity || 0;
                  const isOutOfStock = type.stock !== undefined && type.stock <= 0;

                  const handleAddToCart = async (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (isOutOfStock) {
                      showToast("Out of stock", "info");
                      return;
                    }
                    if (quantity >= (type.stock || 99)) {
                      showToast("Maximum stock reached", "info");
                      return;
                    }

                    try {
                      await addToCart(type as Product, e.currentTarget as HTMLElement);
                      showToast(`${type.name} added to cart`, "success");
                    } catch (err) {
                      // Context handles error toast
                    }
                  };

                  const handleIncrement = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (quantity >= (type.stock || 99)) {
                      showToast("Maximum stock reached", "info");
                      return;
                    }
                    updateQuantity(type.id, quantity + 1);
                  };

                  const handleDecrement = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    updateQuantity(type.id, quantity - 1);
                  };

                  return (
                    <div key={`fish-card-${activeTab}-${type.id}-${i}`} className="bg-white rounded-[22px] border-[1.5px] border-[#009999]/30 hover:border-[#FF6F61] shadow-[0_4px_20px_rgba(0,51,102,0.06)] hover:shadow-[0_12px_30px_rgba(0,51,102,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col overflow-hidden relative group h-full">
                      {/* 🌊 UNDERWATER CARD ENHANCEMENTS */}
                      {/* 1. Very faint top highlight reflection */}
                      <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none z-20" />

                      {/* 2. Subtle inner glow at 4% opacity */}
                      <div className="absolute inset-0 rounded-[22px] shadow-[inset_0_0_20px_rgba(0,224,198,0.04)] pointer-events-none z-10" />

                      {/* Micro shimmer swipe animation on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none z-20" />

                      {/* Image Area - Pure Studio Photography Style */}
                      <div className="w-full pt-[85%] relative bg-white flex-shrink-0">
                        <div className="absolute inset-0 flex items-center justify-center p-4 pb-0">
                          <img
                            src={type.imageUrl}
                            alt={type.name}
                            className={`w-full h-full object-contain drop-shadow-[0_8px_12px_rgba(0,51,102,0.12)] group-hover:scale-[1.03] transition-transform duration-300 ease-out z-10 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/bengali_fish.png'; // Fallback
                            }}
                          />
                        </div>
                        {isOutOfStock && (
                          <div className="absolute top-2 right-2 z-30 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-lg">
                            OUT OF STOCK
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="px-3 pb-3 md:px-4 md:pb-4 flex flex-col flex-grow bg-white z-10 rounded-b-[22px]">
                        <div className="flex-grow">
                          <h3 className="text-[#003366] font-bold text-[13px] md:text-[14px] leading-tight mb-1 truncate group-hover:text-[#FF6F61] transition-colors duration-200">
                            {type.name}
                          </h3>
                          <p className="text-[#003366]/60 font-medium text-[10px] md:text-[11px] leading-snug line-clamp-2 md:line-clamp-2 mb-2">
                            {type.description || (type as any).desc}
                          </p>
                        </div>

                        {/* Divider */}
                        <div className="h-[1px] w-full bg-[#003366]/10 mb-2" />

                        {/* Bottom Row: Rating, Price, Cart Button */}
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex flex-col gap-1 justify-center">
                            {/* Rating Row Studio */}
                            <div className="flex items-center gap-1">
                              <span className="text-[#FF6F61] text-[11px] font-black tracking-wide">★</span>
                              <span className="text-[#003366] font-extrabold text-[11px]">{pseudoRandomRating}</span>
                            </div>

                            {/* Pricing Studio */}
                            <div className="flex items-baseline gap-[2px]">
                              <span className="text-[#003366] font-black text-[15px] tracking-tight">
                                {formattedPrice}
                              </span>
                              <span className="text-[#003366]/40 font-semibold text-[10px]">
                                {type.pack ? `/${type.pack}` : '/kg'}
                              </span>
                            </div>
                          </div>

                          {/* Animated Add to Cart Button or Stepper */}
                          {quantity > 0 ? (
                            <div className="flex items-center bg-[#009999] rounded-full p-0.5 shadow-[0_2px_8px_rgba(0,153,153,0.3)] animate-in fade-in zoom-in duration-200">
                              <button
                                onClick={handleDecrement}
                                className="w-7 h-7 flex items-center justify-center text-white hover:bg-[#008080] rounded-full transition-colors active:scale-90"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              </button>
                              <span className="px-2 text-white font-bold text-[13px] min-w-[20px] text-center">
                                {quantity}
                              </span>
                              <button
                                onClick={handleIncrement}
                                className="w-7 h-7 flex items-center justify-center text-white hover:bg-[#008080] rounded-full transition-colors active:scale-90"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={handleAddToCart}
                              disabled={isOutOfStock}
                              className={`w-8 h-8 md:w-9 md:h-9 rounded-full ${isOutOfStock ? 'bg-neutral-200 cursor-not-allowed' : 'bg-[#009999] group-hover:bg-[#FF6F61]'} text-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,153,153,0.3)] group-hover:shadow-[0_4px_12px_rgba(255,111,97,0.4)] transition-all duration-300 flex-shrink-0 group-hover:scale-[1.08] relative overflow-hidden active:scale-95`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[18px] h-[18px] relative z-10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                              {!isOutOfStock && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:animate-pulse" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div >
  );
}
