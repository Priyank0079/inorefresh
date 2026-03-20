import { useEffect, useState } from "react";
import { getHomeContent } from "../../services/api/customerHomeService";
import { useLocation } from "../../hooks/useLocation";
import { useThemeContext } from "../../context/ThemeContext";
import { getCategories } from "../../services/api/categoryService";
import { apiCache } from "../../utils/apiCache";
import { motion, AnimatePresence } from "framer-motion";
import ExploreCard from "./components/ExploreCard";
import FishLoader from "../../components/FishLoader";

export default function Categories() {
  const { location } = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentTheme } = useThemeContext();
  const [homeData, setHomeData] = useState<any>({
    homeSections: [],
    categories: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Invalidate caches to ensure fresh data
        apiCache.invalidatePattern(/^home-content-/);
        apiCache.invalidatePattern(/^categories-/);

        const response = await getHomeContent(
          undefined,
          location?.latitude,
          location?.longitude,
          false
        );

        if (response.success && response.data) {
          const data = response.data;

          // Fetch all categories including subcategories
          const catRes = await getCategories({ includeSubcategories: true });
          const homeCategories = data.categories || [];
          const fetchedCategories = catRes.success ? catRes.data : [];

          // Merge and deduplicate
          const mergedById = new Map<string, any>();
          [...homeCategories, ...fetchedCategories].forEach((c: any) => {
            const id = c?._id || c?.id || c?.slug;
            if (id) mergedById.set(id, c);
          });

          const categoryList = Array.from(mergedById.values()).filter((c: any) => {
            const name = (c.name || "").toLowerCase();
            return name.includes("aqua") || name.includes("marine") || name.includes("marin") || name.includes("bangali") || name.includes("bengali") || name.includes("bengoli") || name.includes("freshwater") || name.includes("ocean") || name.includes("traditional");
          });

          if (categoryList.length === 0) {
            setError("No categories available right now.");
          }

          data.categories = categoryList;
          // Only show fish categories in sections as well
          data.homeSections = (data.homeSections || [])
            .filter((s: any) => s.displayType !== 'products')
            .map((section: any) => ({
              ...section,
              data: (section.data || []).filter((c: any) => {
                const name = (c.name || c.title || "").toLowerCase();
                return name.includes("aqua") || name.includes("marine") || name.includes("marin") || name.includes("bangali") || name.includes("bengali") || name.includes("bengoli") || name.includes("freshwater") || name.includes("ocean") || name.includes("traditional");
              })
            })).filter((s: any) => s.data.length > 0);

          setHomeData(data);
        } else {
          setError("Failed to load categories. Please try again.");
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location?.latitude, location?.longitude]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfdfd]">
        <FishLoader />
        <p className="mt-4 text-[#1CA7C7] font-bold tracking-widest text-[12px] animate-pulse">PREPARING EXPLORE...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center bg-[#fdfdfd]">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[#072F4A] mb-2 tracking-tight">Oops! Something went wrong</h3>
        <p className="text-gray-500 mb-8 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 text-white rounded-full font-bold shadow-lg transition-transform active:scale-95 hover:shadow-xl"
          style={{ backgroundColor: currentTheme.primary[3] }}
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  const mapCategoryToCard = (c: any, index: number) => {
    const nameLower = (c.name || c.title || "").toLowerCase();
    let displayName = c.name || c.title;
    let link = "";
    let image = c.image || c.imageUrl;

    // Smart mapping for special fish categories with high-quality assets
    if (nameLower.includes('aqua') || nameLower.includes('freshwater') || nameLower.includes('river')) {
      displayName = "Aqua Fish";
      link = '/?tab=aqua-fish';
      if (!image || image.includes('placeholder')) image = '/images/top_list_aqua_fish_trans.png';
    } else if (nameLower.includes('marin') || nameLower.includes('ocean') || nameLower.includes('sea')) {
      displayName = "Marine Fish";
      link = '/?tab=marine-fish';
      if (!image || image.includes('placeholder')) image = '/images/top_list_marin_fish_trans.png';
    } else if (nameLower.includes('bangali') || nameLower.includes('bengali') || nameLower.includes('bengoli') || nameLower.includes('traditional') || nameLower.includes('favorite')) {
      displayName = "Bengali Fish";
      link = '/?tab=bangali-fish';
      if (!image || image.includes('placeholder')) image = '/images/top_list_bengali_fish_trans.png';
    } else {
      link = `/category/${c.slug || c._id || c.id}`;
    }

    return (
      <ExploreCard
        key={c._id || c.id || c.slug}
        id={c._id || c.id || c.slug}
        name={displayName}
        image={image}
        iconName={c.iconName}
        link={link}
        index={index}
      />
    );
  };

  return (
    <div className="pb-24 min-h-screen bg-[#fdfdfd] relative overflow-hidden">
      {/* ATMOSPHERIC BACKGROUND ELEMENTS */}
      <div className="absolute top-[5%] left-[-15%] w-[50%] h-[50%] bg-[#1CA7C7]/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-[#6FD3FF]/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] bg-[#BEEFFF]/10 blur-[90px] pointer-events-none rounded-full" />

      {/* Space for fixed OceanNavbar to prevent overlap */}
      <div className="h-14 md:h-16" aria-hidden="true" />

      {/* HEADER SECTION */}
      <div className="relative pt-4 pb-6 px-4 md:px-8 max-w-[1280px] mx-auto text-center md:text-left">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-5xl leading-tight font-black text-[#072F4A] tracking-tighter mb-2">
            Explore <span className="text-[#1CA7C7]">Categories</span>
          </h1>
          <p className="text-[#072F4A]/50 text-xs sm:text-sm md:text-lg font-medium tracking-wide">
            Dive into our premium selection of fresh aquatic delicacies
          </p>
        </motion.div>
      </div>

      <div className="relative px-4 md:px-8 max-w-[1280px] mx-auto space-y-12">
        {/* Render Home Sections Filters (Category-based) */}
        {homeData.homeSections && homeData.homeSections.length > 0 && (
          <div className="space-y-12">
            {homeData.homeSections.map((section: any) => (
              <div key={section.id} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl md:text-2xl font-bold text-[#072F4A] whitespace-nowrap">
                    {section.title}
                  </h2>
                  <div className="h-[1px] w-full bg-gradient-to-r from-[#072F4A]/10 to-transparent" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                  {(section.data || []).map((c: any, idx: number) => mapCategoryToCard(c, idx))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DEFAULT CATEGORIES DUMP */}
        {homeData.categories && homeData.categories.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-[#072F4A] whitespace-nowrap">
                All Categories
              </h2>
              <div className="h-[1px] w-full bg-gradient-to-r from-[#072F4A]/10 to-transparent" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
              {homeData.categories.map((c: any, idx: number) => mapCategoryToCard(c, idx))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!homeData.categories || homeData.categories.length === 0) && (!homeData.homeSections || homeData.homeSections.length === 0) && (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[32px] border border-[#072F4A]/5 shadow-sm">
            <div className="w-24 h-24 mx-auto mb-6 text-[#1CA7C7]/20">
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#072F4A] mb-2 uppercase tracking-[0.1em]">Treasures Missing</h3>
            <p className="text-gray-400 max-w-sm mx-auto">Our current selection is being updated. Please check back shortly for fresh arrivals.</p>
          </div>
        )}
      </div>
    </div>
  );
}


