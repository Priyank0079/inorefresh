import { useEffect, useState } from "react";
import { getHomeContent } from "../../services/api/customerHomeService";
import { useLocation } from "../../hooks/useLocation";
import CategoryTileSection from "./components/CategoryTileSection";
import ProductCard from "./components/ProductCard";
import { useThemeContext } from "../../context/ThemeContext";
import { getCategories } from "../../services/api/categoryService";
import { apiCache } from "../../utils/apiCache";

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
        // Keep category page fresh after warehouse/admin updates.
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
          // Always pull latest categories and merge with home payload categories.
          const catRes = await getCategories({ includeSubcategories: true });
          const homeCategories = data.categories || [];
          const fetchedCategories = catRes.success ? catRes.data : [];

          const mergedById = new Map<string, any>();
          [...homeCategories, ...fetchedCategories].forEach((c: any) => {
            const id = c?._id || c?.id || c?.slug;
            if (id) mergedById.set(id, c);
          });

          const categoryList = Array.from(mergedById.values()).filter((c: any) => {
            const name = (c.name || "").toLowerCase();
            const slug = (c.slug || "").toLowerCase();
            return (
              name.includes("aqua") ||
              name.includes("marine") ||
              name.includes("bangali") ||
              name.includes("bengali") ||
              slug.includes("aqua") ||
              slug.includes("marine") ||
              slug.includes("bangali") ||
              slug.includes("bengali")
            );
          });

          if (categoryList.length === 0) {
            setError("No fish categories available right now.");
          }

          data.categories = categoryList;
          data.homeSections = []; // Remove other dynamic sections as requested
          setHomeData(data);
        } else {
          setError("Failed to load categories. Please try again.");
        }
      } catch (error) {
        console.error("Failed to fetch home content:", error);
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location?.latitude, location?.longitude]);

  if (loading && !homeData.homeSections.length) {
    return null; // Let global IconLoader handle it
  }

  if (error && !homeData.homeSections.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center bg-white">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 text-white rounded-full font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: currentTheme.primary[3] }}
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  const mapCategoryToLink = (c: any) => {
    const name = (c.name || c.title || "").toLowerCase();
    let link = '';

    // Map special categories to home tabs and assign HD images
    if (name.includes('aqua') || name.includes('auqa')) {
      link = '/?tab=aqua-fish';
      if (!c.image && !c.imageUrl) c.imageUrl = '/images/top_list_aqua_fish_trans.png';
    }
    else if (name.includes('marin') || name.includes('marine')) {
      link = '/?tab=marine-fish';
      if (!c.image && !c.imageUrl) c.imageUrl = '/images/top_list_marin_fish_trans.png';
    }
    else if (name.includes('bengali') || name.includes('bengoli')) {
      link = '/?tab=bangali-fish';
      if (!c.image && !c.imageUrl) c.imageUrl = '/images/top_list_bengali_fish_trans.png';
    }
    else link = `/category/${c.slug || c._id || c.id}`;

    return {
      id: c._id || c.id || c.slug,
      name: c.name || c.title,
      image: c.image || c.imageUrl,
      categoryId: c.slug || c._id || c.id,
      link: link,
      type: "category"
    };
  };

  return (
    <div className="pb-4 md:pb-8 bg-white min-h-screen">
      <div className="bg-neutral-50 pt-1 space-y-5 md:space-y-8 md:pt-4">
        {/* Render all admin-created home sections */}
        {homeData.homeSections && homeData.homeSections.length > 0 ? (
          <>
            {homeData.homeSections.map((section: any) => {
              const columnCount = Number(section.columns) || 4;

              if (section.displayType === "products" && section.data && section.data.length > 0) {
                // Products display - same as home page
                const gridClass = {
                  2: "grid-cols-2",
                  3: "grid-cols-3",
                  4: "grid-cols-4",
                  6: "grid-cols-6",
                  8: "grid-cols-8"
                }[columnCount] || "grid-cols-4";

                const isCompact = columnCount >= 4;
                const gapClass = columnCount >= 4 ? "gap-2" : "gap-3 md:gap-4";

                return (
                  <div key={section.id} className="mt-6 mb-6 md:mt-8 md:mb-8">
                    {section.title && (
                      <h2 className="text-lg md:text-2xl font-semibold text-neutral-900 mb-3 md:mb-6 px-4 md:px-6 lg:px-8 tracking-tight capitalize">
                        {section.title}
                      </h2>
                    )}
                    <div className="px-4 md:px-6 lg:px-8">
                      <div className={`grid ${gridClass} ${gapClass}`}>
                        {section.data.map((product: any) => (
                          <ProductCard
                            key={product.id || product._id}
                            product={product}
                            categoryStyle={true}
                            showBadge={true}
                            showPackBadge={false}
                            showStockInfo={false}
                            compact={isCompact}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // Categories/Subcategories display - same as home page
              return (
                <CategoryTileSection
                  key={section.id}
                  title={section.title}
                  tiles={(section.data || []).map(mapCategoryToLink)}
                  columns={columnCount as 2 | 3 | 4 | 6 | 8}
                  showProductCount={false}
                />
              );
            })}
          </>
        ) : null}

        {homeData.categories && homeData.categories.length > 0 ? (
          <div className="mt-4">
            <CategoryTileSection
              title="Fish Categories"
              tiles={homeData.categories.map(mapCategoryToLink)}
              columns={3}
            />
          </div>
        ) : (
          <div className="text-center py-12 md:py-16 text-neutral-500 px-4">
            <p className="text-lg md:text-xl mb-2">No categories found</p>
            <p className="text-sm md:text-base">
              Please create home sections or categories from the admin panel
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

