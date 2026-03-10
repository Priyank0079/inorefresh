import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import { useLocation } from "../../hooks/useLocation";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { Product } from "../../types/domain";
import { motion, AnimatePresence } from "framer-motion";
import HomeHero from "./components/HomeHero";
import PromoStrip from "./components/PromoStrip";
import LowestPricesEver from "./components/LowestPricesEver";
import FishLoader from "../../components/FishLoader";
import { getHomeContent } from "../../services/api/customerHomeService";
import { getProducts as getCustomerProducts } from "../../services/api/customerProductService";
import { getHeaderCategoriesPublic } from "../../services/api/headerCategoryService";
import { useLoading } from "../../context/LoadingContext";
import PageLoader from "../../components/PageLoader";
import CategoryTileSection from "./components/CategoryTileSection";
import FishCategoryCards from "./components/FishCategoryCards";
import ProductCard from "./components/ProductCard";

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

  const [tabProducts, setTabProducts] = useState<any[]>([]);
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

    if (tabParam) {
      setActiveTab(tabParam);

      // Simple auto-scroll to products if a category is selected via URL
      if (tabParam !== 'all') {
        const timer = setTimeout(() => {
          const section = document.getElementById('fish-products-section');
          if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [routerLocation.search, setActiveTab]);

  // Fetch products for active tab (all tabs are backend-driven)
  useEffect(() => {
    const fetchTabProducts = async () => {
      try {
        const params: any = { limit: 40 };
        if (activeTab !== "all") {
          params.category = activeTab;
        }
        if (location?.latitude && location?.longitude) {
          params.latitude = location.latitude;
          params.longitude = location.longitude;
        }

        const res = await getCustomerProducts(params);
        if (res.success) {
          setTabProducts(res.data || []);
        } else {
          setTabProducts([]);
        }
      } catch (error) {
        console.error(`Failed to fetch products for tab ${activeTab}:`, error);
        setTabProducts([]);
      }
    };

    fetchTabProducts();
  }, [activeTab, location?.latitude, location?.longitude]);

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
        const headerCategories = await getHeaderCategoriesPublic();
        const slugsToPreload = (headerCategories || [])
          .map((c: any) => c.slug)
          .filter((slug: string) => typeof slug === "string" && slug.trim().length > 0)
          .slice(0, 6);

        if (slugsToPreload.length === 0) return;

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

  const filteredProducts = useMemo(
    () => tabProducts,
    [tabProducts]
  );

  if (loading && tabProducts.length === 0) {
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
    <div className="min-h-screen pb-20 md:pb-0 relative z-10" ref={contentRef}>
      {/* 🌟 FLOATING SECTION HIGHLIGHTS */}
      <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-[#1CA7C7]/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-[60%] right-[-10%] w-[30%] h-[30%] bg-[#6FD3FF]/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Hero Header with Gradient and Tabs */}
      <HomeHero activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'all' && (
        <div className="relative z-10">
          {/* Promo Strip */}
          <PromoStrip activeTab={activeTab} />

          {/* 🐟 NEW FISH CATEGORIES SECTION */}
          <div className="py-8 bg-transparent">
            <FishCategoryCards />
          </div>



          {/* LOWEST PRICES EVER Section */}
          <LowestPricesEver activeTab={activeTab} products={homeData.lowestPrices} />
        </div>
      )}

      {/* Main content - Premium Products Grid */}
      <div id="fish-products-section" className="pt-6 space-y-5 md:space-y-8 md:pt-8 w-full relative z-10">
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
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-6 w-full"
            >
              {filteredProducts.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <svg className="w-10 h-10 text-[#6FD3FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-1">No products found</h3>
                  <p className="text-[#BEEFFF]/60 max-w-xs">We couldn't find any products in the {activeTab} category right now.</p>
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
                    <ProductCard
                      key={`fish-card-${activeTab}-${type._id || type.id}-${i}`}
                      product={type as Product}
                    />
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
