import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation as useRouterLocation } from "react-router-dom";
import { useLocation } from "../../hooks/useLocation";
import { motion, AnimatePresence } from "framer-motion";
import HomeHero from "./components/HomeHero";
import PromoStrip from "./components/PromoStrip";
import LowestPricesEver from "./components/LowestPricesEver";
import { getHomeContent } from "../../services/api/customerHomeService";
import { getProducts as getCustomerProducts } from "../../services/api/customerProductService";
import { getHeaderCategoriesPublic } from "../../services/api/headerCategoryService";
import PageLoader from "../../components/PageLoader";
import Footer from "../../components/Footer";
import FishCategoryCards from "./components/FishCategoryCards";
import ProductCard from "./components/ProductCard";

import { useThemeContext } from "../../context/ThemeContext";

const isVirtualFishTab = (tab: string) =>
  tab === "aqua-fish" || tab === "marine-fish" || tab === "bangali-fish";

const normalizeTabId = (tab: string) => {
  const normalized = (tab || "")
    .toLowerCase()
    .trim()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");

  if (
    [
      "aqua",
      "aqua-fish",
      "auqa",
      "auqa-fish",
      "freshwater",
      "freshwater-fish",
      "river",
      "river-fish",
    ].includes(normalized)
  ) {
    return "aqua-fish";
  }

  if (
    [
      "marine",
      "marine-fish",
      "marin",
      "marin-fish",
      "sea",
      "sea-fish",
      "ocean",
      "ocean-fish",
    ].includes(normalized)
  ) {
    return "marine-fish";
  }

  if (
    [
      "bangali",
      "bangali-fish",
      "bengali",
      "bengali-fish",
      "bengoli",
      "bengoli-fish",
      "traditional",
      "traditional-fish",
    ].includes(normalized)
  ) {
    return "bangali-fish";
  }

  return normalized || "all";
};

const VIRTUAL_FISH_TAB_ALIASES: Record<string, string[]> = {
  "aqua-fish": [
    "aqua fish",
    "aqua",
    "freshwater-fish",
    "freshwater fish",
    "freshwater",
    "river-fish",
    "river fish",
  ],
  "marine-fish": [
    "marine fish",
    "marin-fish",
    "marin fish",
    "sea-fish",
    "sea fish",
    "ocean-fish",
    "ocean fish",
  ],
  "bangali-fish": [
    "bangali fish",
    "bengali-fish",
    "bengali fish",
    "bengoli-fish",
    "bengoli fish",
    "traditional-fish",
    "traditional fish",
  ],
};

const PRODUCTS_PAGE_SIZE = 20;

type ProductSourcePlan =
  | { type: "all" }
  | { type: "category"; category: string }
  | { type: "all-filtered" };

interface TabProductsCacheEntry {
  items: any[];
  nextPage: number;
  hasMore: boolean;
  sourcePlan: ProductSourcePlan | null;
}

const getProductCategoryHaystack = (product: any) => {
  const rawCategory = product?.category;
  const rawCategoryText =
    typeof rawCategory === "string"
      ? rawCategory
      : `${rawCategory?.name || ""} ${rawCategory?.slug || ""}`;
  const categoryDataText = `${product?.categoryData?.name || ""} ${product?.categoryData?.slug || ""}`;
  const tagsText = Array.isArray(product?.tags) ? product.tags.join(" ") : "";

  return `${rawCategoryText} ${product?.categoryId || ""} ${categoryDataText} ${tagsText}`
    .toLowerCase()
    .replace(/[_-]/g, " ");
};

const belongsToVirtualFishTab = (tab: string, product: any) => {
  const haystack = getProductCategoryHaystack(product);
  const normalizedTab = normalizeTabId(tab);

  if (normalizedTab === "aqua-fish") {
    return (
      haystack.includes("aqua") ||
      haystack.includes("freshwater") ||
      haystack.includes("river")
    );
  }

  if (normalizedTab === "marine-fish") {
    return (
      haystack.includes("marine") ||
      haystack.includes("marin") ||
      haystack.includes("ocean") ||
      haystack.includes("sea")
    );
  }

  if (normalizedTab === "bangali-fish") {
    return (
      haystack.includes("bangali") ||
      haystack.includes("bengali") ||
      haystack.includes("bengoli") ||
      haystack.includes("traditional")
    );
  }

  return true;
};

export default function Home() {
  const routerLocation = useRouterLocation();
  const { location } = useLocation();
  const { activeCategory, setActiveCategory, dateFilter } = useThemeContext();
  const activeTab = activeCategory; // mapping for existing code compatibility
  const setActiveTab = setActiveCategory;
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollHandledRef = useRef(false);
  const tabProductsCacheRef = useRef<Record<string, TabProductsCacheEntry>>({});
  const tabFetchResolvedRef = useRef<Record<string, boolean>>({});
  const preloadedLocationKeysRef = useRef<Set<string>>(new Set());
  const activeSourcePlanRef = useRef<ProductSourcePlan | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
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
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
  const [nextProductsPage, setNextProductsPage] = useState(2);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const normalizedLatitude =
    typeof location?.latitude === "number" && Number.isFinite(location.latitude)
      ? Number(location.latitude.toFixed(3))
      : undefined;
  const normalizedLongitude =
    typeof location?.longitude === "number" && Number.isFinite(location.longitude)
      ? Number(location.longitude.toFixed(3))
      : undefined;
  const activeLocationKey =
    normalizedLatitude !== undefined && normalizedLongitude !== undefined
      ? `${normalizedLatitude}:${normalizedLongitude}`
      : "no-location";
  const normalizedActiveTab = normalizeTabId(activeTab);
  const activeTabCacheKey = `${normalizedActiveTab}:${activeLocationKey}:${dateFilter}`;
  const hasResolvedActiveTab =
    Boolean(tabFetchResolvedRef.current[activeTabCacheKey]) ||
    Boolean(tabProductsCacheRef.current[activeTabCacheKey]);

  // Sync React Router Tab Parameter to Global App State
  useEffect(() => {
    const searchParams = new URLSearchParams(routerLocation.search);
    const tabParam = searchParams.get('tab');

    if (tabParam) {
      const normalizedTab = normalizeTabId(tabParam);
      setActiveTab(normalizedTab);
      scrollHandledRef.current = false; // Reset scroll handler so it scrolls when products load

      // Auto-scroll to products if a category is selected via URL
      if (normalizedTab !== 'all') {
        const timer = setTimeout(() => {
          const section = document.getElementById('fish-products-section');
          if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [routerLocation.search, setActiveTab]);

  const getProductKey = useCallback((product: any) => {
    return String(product?._id || product?.id || product?.product_tag || product?.productName || "");
  }, []);

  const buildBaseProductParams = useCallback(
    (page: number) => {
      const params: any = {
        page,
        limit: PRODUCTS_PAGE_SIZE,
      };

      if (normalizedLatitude !== undefined && normalizedLongitude !== undefined) {
        params.latitude = normalizedLatitude;
        params.longitude = normalizedLongitude;
      }

      if (dateFilter > 0) {
        const date = new Date();
        date.setDate(date.getDate() - (dateFilter - 1));
        const dateStr = date.toISOString().split('T')[0];
        params.dateFrom = dateStr;
        // dateTo is usually today by default in backend if not provided, but we can be explicit
        params.dateTo = new Date().toISOString().split('T')[0];
      }

      return params;
    },
    [normalizedLatitude, normalizedLongitude, dateFilter]
  );

  const fetchProductsPageByPlan = useCallback(
    async (plan: ProductSourcePlan, page: number) => {
      const params = buildBaseProductParams(page);
      if (plan.type === "category") {
        params.category = plan.category;
      }

      const response = await getCustomerProducts(params);
      const responseItems = response.success ? response.data || [] : [];
      const pagination = response.pagination;
      const serverHasMore =
        pagination && Number.isFinite(pagination.page) && Number.isFinite(pagination.pages)
          ? pagination.page < pagination.pages
          : responseItems.length >= PRODUCTS_PAGE_SIZE;

      if (plan.type === "all-filtered") {
        return {
          items: responseItems.filter((product: any) =>
            belongsToVirtualFishTab(normalizedActiveTab, product)
          ),
          hasMore: serverHasMore,
        };
      }

      return {
        items: responseItems,
        hasMore: serverHasMore,
      };
    },
    [buildBaseProductParams, normalizedActiveTab, dateFilter]
  );

  const loadMoreProducts = useCallback(async () => {
    if (isTabLoading || isLoadingMoreProducts || !hasMoreProducts) {
      return;
    }

    const sourcePlan = activeSourcePlanRef.current;
    if (!sourcePlan) return;

    const cacheKey = `${normalizedActiveTab}:${activeLocationKey}:${dateFilter}`;

    setIsLoadingMoreProducts(true);
    try {
      const pageData = await fetchProductsPageByPlan(sourcePlan, nextProductsPage);

      setTabProducts((prev) => {
        const existingKeys = new Set(prev.map((item) => getProductKey(item)));
        const appended = pageData.items.filter((item: any) => {
          const key = getProductKey(item);
          return key && !existingKeys.has(key);
        });
        const merged = [...prev, ...appended];

        tabProductsCacheRef.current[cacheKey] = {
          items: merged,
          nextPage: nextProductsPage + 1,
          hasMore: pageData.hasMore,
          sourcePlan,
        };

        return merged;
      });

      setNextProductsPage((prev) => prev + 1);
      setHasMoreProducts(pageData.hasMore);
    } catch (error) {
      console.error(`Failed to load more products for tab ${normalizedActiveTab}:`, error);
    } finally {
      setIsLoadingMoreProducts(false);
    }
  }, [
    isTabLoading,
    isLoadingMoreProducts,
    hasMoreProducts,
    normalizedActiveTab,
    activeLocationKey,
    fetchProductsPageByPlan,
    nextProductsPage,
    getProductKey,
    dateFilter,
  ]);

  // Fetch first page of products for active tab
  useEffect(() => {
    let cancelled = false;

    const fetchFirstPage = async () => {
      const cacheKey = `${normalizedActiveTab}:${activeLocationKey}:${dateFilter}`;
      const cachedEntry = tabProductsCacheRef.current[cacheKey];

      if (cachedEntry) {
        if (cancelled) return;
        activeSourcePlanRef.current = cachedEntry.sourcePlan;
        tabFetchResolvedRef.current[cacheKey] = true;
        setTabProducts(cachedEntry.items);
        setNextProductsPage(cachedEntry.nextPage);
        setHasMoreProducts(cachedEntry.hasMore);
        setIsLoadingMoreProducts(false);
        return;
      }

      setTabProducts([]);
      setNextProductsPage(2);
      setHasMoreProducts(false);
      setIsLoadingMoreProducts(false);
      setIsTabLoading(true);

      try {
        const getServerPage = async (category?: string) => {
          const params = buildBaseProductParams(1);
          if (category) params.category = category;
          const res = await getCustomerProducts(params);
          const items = res.success ? res.data || [] : [];
          const hasMore =
            res.pagination && Number.isFinite(res.pagination.page) && Number.isFinite(res.pagination.pages)
              ? res.pagination.page < res.pagination.pages
              : items.length >= PRODUCTS_PAGE_SIZE;
          return { items, hasMore };
        };

        let sourcePlan: ProductSourcePlan | null = null;
        let firstItems: any[] = [];
        let hasMore = false;

        if (normalizedActiveTab === "all") {
          sourcePlan = { type: "all" };
          const pageData = await getServerPage();
          firstItems = pageData.items;
          hasMore = pageData.hasMore;
        } else {
          // Backend now handles virtual tabs like 'aqua-fish' automatically.
          // No need to loop through aliases or do client-side filtering.
          sourcePlan = { type: "category", category: normalizedActiveTab };
          const pageData = await getServerPage(normalizedActiveTab);
          firstItems = pageData.items;
          hasMore = pageData.hasMore;
        }

        if (cancelled) return;

        activeSourcePlanRef.current = sourcePlan;
        const cacheEntry: TabProductsCacheEntry = {
          items: firstItems,
          nextPage: 2,
          hasMore,
          sourcePlan,
        };
        tabProductsCacheRef.current[cacheKey] = cacheEntry;
        tabFetchResolvedRef.current[cacheKey] = true;
        setTabProducts(firstItems);
        setNextProductsPage(2);
        setHasMoreProducts(hasMore);
      } catch (error) {
        console.error(`Failed to fetch products for tab ${normalizedActiveTab}:`, error);
        if (cancelled) return;
        tabFetchResolvedRef.current[cacheKey] = true;
        setTabProducts([]);
        setHasMoreProducts(false);
        setNextProductsPage(2);
      } finally {
        if (!cancelled) {
          setIsTabLoading(false);
        }
      }
    };

    fetchFirstPage();

    return () => {
      cancelled = true;
    };
  }, [
    normalizedActiveTab,
    activeLocationKey,
    buildBaseProductParams,
    fetchProductsPageByPlan,
    dateFilter,
  ]);

  // Infinite scroll trigger
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMoreProducts || isTabLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          loadMoreProducts();
        }
      },
      {
        root: null,
        rootMargin: "260px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreProducts, isTabLoading, loadMoreProducts]);

  // Client-side filtering for the 3 professional tabs
  const filteredProducts = tabProducts;

  // Auto-scroll to products when they load for a specific category
  useEffect(() => {
    if (!isTabLoading && tabProducts.length > 0 && normalizedActiveTab !== 'all' && !scrollHandledRef.current) {
      scrollHandledRef.current = true;
      const timer = setTimeout(() => {
        const section = document.getElementById('fish-products-section');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isTabLoading, tabProducts, normalizedActiveTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getHomeContent(
          undefined,
          normalizedLatitude,
          normalizedLongitude
        );

        if (response.success && response.data) {
          const content = response.data;

          // Filter categories strictly to our 3 main types
          if (content.categories) {
            content.categories = content.categories.filter((c: any) => {
              const name = (c.name || "").toLowerCase();
              return (
                name.includes("aqua") ||
                name.includes("marine") ||
                name.includes("marin") ||
                name.includes("bangali") ||
                name.includes("bengali") ||
                name.includes("bengoli") ||
                name.includes("freshwater") ||
                name.includes("ocean") ||
                name.includes("traditional")
              );
            }).map((c: any) => {
              const n = (c.name || "").toLowerCase();
              if (n.includes("aqua") || n.includes("freshwater") || n.includes("river")) return { ...c, name: "Aqua Fish" };
              if (n.includes("marine") || n.includes("marin") || n.includes("ocean") || n.includes("sea")) return { ...c, name: "Marine Fish" };
              if (n.includes("bangali") || n.includes("bengali") || n.includes("bengoli") || n.includes("traditional")) return { ...c, name: "Bangali Fish" };
              return c;
            });
          }

          if (content.homeSections) {
            content.homeSections = content.homeSections.map((s: any) => {
              if (s.data && Array.isArray(s.data)) {
                s.data = s.data.filter((c: any) => {
                  const name = (c.name || c.title || "").toLowerCase();
                  return (
                    name.includes("aqua") ||
                    name.includes("marine") ||
                    name.includes("marin") ||
                    name.includes("bangali") ||
                    name.includes("bengali") ||
                    name.includes("bengoli") ||
                    name.includes("freshwater") ||
                    name.includes("ocean") ||
                    name.includes("traditional")
                  );
                }).map((c: any) => {
                  const n = (c.name || c.title || "").toLowerCase();
                  if (n.includes("aqua") || n.includes("freshwater") || n.includes("river")) return { ...c, name: "Aqua Fish", title: "Aqua Fish" };
                  if (n.includes("marine") || n.includes("marin") || n.includes("ocean") || n.includes("sea")) return { ...c, name: "Marine Fish", title: "Marine Fish" };
                  if (n.includes("bangali") || n.includes("bengali") || n.includes("bengoli") || n.includes("traditional")) return { ...c, name: "Bangali Fish", title: "Bangali Fish" };
                  return c;
                });
              }
              return s;
            }).filter((s: any) => s.displayType === 'products' || (s.data && s.data.length > 0));
          }

          setHomeData(content);
          setError(null);
        } else {
          setError("Failed to load content. Please try again.");
        }
      } catch (err) {
        console.error("Error fetching home content:", err);
        setError("Failed to load content. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [normalizedLatitude, normalizedLongitude]);

  // Preload common category data for snappier navigation
  useEffect(() => {
    if (preloadedLocationKeysRef.current.has(activeLocationKey)) {
      return;
    }

    let isCancelled = false;
    const preloadHeaderCategories = async () => {
      try {
        preloadedLocationKeysRef.current.add(activeLocationKey);
        const headerCategories = await getHeaderCategoriesPublic();
        const slugsToPreload = (headerCategories || [])
          .map((c: any) => c.slug)
          .filter((slug: string) => typeof slug === "string" && slug.trim().length > 0)
          .slice(0, 3);

        if (slugsToPreload.length === 0) return;

        const batchSize = 2;
        for (let i = 0; i < slugsToPreload.length; i += batchSize) {
          if (isCancelled) return;
          const batch = slugsToPreload.slice(i, i + batchSize);
          await Promise.all(
            batch.map(slug =>
              getHomeContent(
                slug,
                normalizedLatitude,
                normalizedLongitude,
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

    const timer = window.setTimeout(() => {
      if (!isCancelled) {
        preloadHeaderCategories();
      }
    }, 1200);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeLocationKey, normalizedLatitude, normalizedLongitude]);

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

      {/* Hero Header only for ALL tab */}
      {activeTab === "all" ? (
        <HomeHero activeTab={activeTab} onTabChange={setActiveTab} />
      ) : (
        // Category header with back button for mobile
        <div className="sticky top-0 z-40 border-b border-[#9FD8EE]/40 shadow-sm md:hidden" style={{ background: 'linear-gradient(135deg, #C4EAF7 0%, #B0E0F5 50%, #9DD6F2 100%)' }}>
          <div className="px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => setActiveTab('all')}
              className="w-11 h-11 flex items-center justify-center text-[#072F4A] hover:bg-[#072F4A]/10 active:bg-[#072F4A]/20 rounded-full transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Go back to all products"
              title="Go back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-[#072F4A] flex-1 truncate capitalize">
              {activeTab}
            </h1>
          </div>
        </div>
      )}

      {activeTab === 'all' && (
        <div className="relative z-10">
          {/* Promo Strip */}
          <PromoStrip activeTab={activeTab} />

          {/* 🐟 NEW FISH CATEGORIES SECTION */}
          <div className="py-2 bg-transparent">
            <FishCategoryCards />
          </div>



          {/* LOWEST PRICES EVER Section */}
          <LowestPricesEver activeTab={activeTab} products={homeData.lowestPrices} />
        </div>
      )}

      {/* Main content - Premium Products Grid */}
      <div id="fish-products-section" className="pt-10 space-y-5 md:space-y-8 md:pt-12 w-full relative z-10">
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
                  duration: 0.20,
                  ease: "easeOut"
                }
              }}
              exit={{
                opacity: 0,
                y: 0,
                transition: {
                  duration: 0.15,
                  ease: "easeIn"
                }
              }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-6 w-full min-h-[400px] mt-4"
            >
              {(isTabLoading || !hasResolvedActiveTab) ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-4 border-[#6FD3FF]/30 border-t-[#6FD3FF] animate-spin" />
                  <p className="text-[#D6E6F2] mt-3 text-sm font-semibold">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
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
                  return (
                    <ProductCard
                      key={`fish-card-${activeTab}-${type._id || type.id}-${i}`}
                      product={type}
                    />
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>

          {!isTabLoading && filteredProducts.length > 0 && (
            <div ref={loadMoreSentinelRef} className="h-1 w-full" />
          )}

          {isLoadingMoreProducts && (
            <div className="py-6 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-4 border-[#6FD3FF]/30 border-t-[#6FD3FF] animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom brand strip */}
      <div className="md:hidden w-full mt-4 pb-24">
        <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #003d6b 0%, #005a8e 50%, #007a99 100%)' }}>
          {/* Wave top */}
          <svg viewBox="0 0 390 30" className="w-full -mb-1" preserveAspectRatio="none">
            <path d="M0,20 C80,35 160,5 240,18 C310,30 360,10 390,20 L390,0 L0,0 Z" fill="white" fillOpacity="0.07"/>
            <path d="M0,28 C60,15 130,32 200,22 C270,12 340,28 390,20 L390,0 L0,0 Z" fill="white" fillOpacity="0.05"/>
          </svg>

          <div className="px-5 pt-3 pb-5">
            {/* Brand */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-black text-xl tracking-tight">INOR<span className="text-[#00d4ff]">FRESH</span></h3>
                <p className="text-white/50 text-[10px] font-medium tracking-widest uppercase mt-0.5">Premium Fresh Seafood</p>
              </div>
              {/* Social icons */}
              <div className="flex gap-2">
                <a href="https://www.facebook.com/inorfresh" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-[#1877F2] hover:text-white transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/inorfresh" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-[#E1306C] hover:text-white transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/inorfresh/" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-[#0A66C2] hover:text-white transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                  </svg>
                </a>
                <a href="https://x.com/inorfresh" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-black hover:text-white transition-all">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.858L1.258 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Contact row */}
            <div className="flex items-center gap-4 py-2.5 border-t border-white/10">
              <a href="tel:+919481214922" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span className="text-[11px] font-medium">+91 94812 14922</span>
              </a>
              <a href="mailto:inorfresh@gmail.com" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span className="text-[11px] font-medium">inorfresh@gmail.com</span>
              </a>
            </div>

            <p className="text-white/30 text-[9px] text-center mt-2 tracking-wider">© 2026 ACQACORAL DELICACIES PRIVATE LIMITED</p>
          </div>
        </div>
      </div>

      {/* Site footer — desktop/web only; mobile keeps the bottom nav instead */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
