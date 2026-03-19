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
  const { activeCategory, setActiveCategory } = useThemeContext();
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
  const activeTabCacheKey = `${normalizedActiveTab}:${activeLocationKey}`;
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

      // Simple auto-scroll to products if a category is selected via URL
      if (normalizedTab !== 'all') {
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

      return params;
    },
    [normalizedLatitude, normalizedLongitude]
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
    [buildBaseProductParams, normalizedActiveTab]
  );

  const loadMoreProducts = useCallback(async () => {
    if (isTabLoading || isLoadingMoreProducts || !hasMoreProducts) {
      return;
    }

    const sourcePlan = activeSourcePlanRef.current;
    if (!sourcePlan) return;

    const cacheKey = `${normalizedActiveTab}:${activeLocationKey}`;

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
  ]);

  // Fetch first page of products for active tab
  useEffect(() => {
    let cancelled = false;

    const fetchFirstPage = async () => {
      const cacheKey = `${normalizedActiveTab}:${activeLocationKey}`;
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
        } else if (!isVirtualFishTab(normalizedActiveTab)) {
          sourcePlan = { type: "category", category: normalizedActiveTab };
          const pageData = await getServerPage(normalizedActiveTab);
          firstItems = pageData.items;
          hasMore = pageData.hasMore;
        } else {
          const candidates = [normalizedActiveTab, ...(VIRTUAL_FISH_TAB_ALIASES[normalizedActiveTab] || [])];

          for (const candidate of candidates) {
            const pageData = await getServerPage(candidate);
            if (pageData.items.length === 0) continue;

            const filtered = pageData.items.filter((item: any) =>
              belongsToVirtualFishTab(normalizedActiveTab, item)
            );

            sourcePlan = { type: "category", category: candidate };
            firstItems = filtered.length > 0 ? filtered : pageData.items;
            hasMore = pageData.hasMore;
            break;
          }

          if (!sourcePlan) {
            sourcePlan = { type: "all-filtered" };
            const pageData = await fetchProductsPageByPlan(sourcePlan, 1);
            firstItems = pageData.items;
            hasMore = pageData.hasMore;
          }
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
  const filteredProducts = useMemo(() => {
    if (normalizedActiveTab === "all") return tabProducts;

    if (!isVirtualFishTab(normalizedActiveTab)) return tabProducts;

    return tabProducts.filter((product: any) =>
      belongsToVirtualFishTab(normalizedActiveTab, product)
    );
  }, [tabProducts, normalizedActiveTab]);

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
        // Keep space for fixed top navbar when hero is hidden
        <div className="h-[90px] md:h-[100px]" aria-hidden="true" />
      )}

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
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-6 w-full min-h-[400px]"
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
    </div>
  );
}
