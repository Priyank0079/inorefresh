import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ProductCard from "./components/ProductCard";
import {
  getProducts,
  getCategoryById,
  Category as ApiCategory,
} from "../../services/api/customerProductService";
import { useLocation as useLocationContext } from "../../hooks/useLocation";

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { location: userLocation } = useLocationContext();

  const [category, setCategory] = useState<ApiCategory | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (!id) return;

      setCategoryLoading(true);
      setError(null);

      try {
        const response = await getCategoryById(id);
        if (response.success && response.data) {
          const cat = response.data.category || response.data;
          setCategory(cat);
        } else {
          setError("Category not found or failed to load details.");
        }
      } catch (fetchError) {
        console.error("Error fetching category details:", fetchError);
        setError("Failed to load category information.");
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategoryDetails();
  }, [id]);

  useEffect(() => {
    const fetchProductsForCategory = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const params: any = { category: category?._id || id };

        if (userLocation?.latitude && userLocation?.longitude) {
          params.latitude = userLocation.latitude;
          params.longitude = userLocation.longitude;
        }

        const response = await getProducts(params);
        if (response.success) {
          setProducts(response.data || []);
        } else {
          setError("Failed to fetch products for this category.");
        }
      } catch (fetchError) {
        console.error("Error fetching products:", fetchError);
        setError("Network error while loading products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductsForCategory();
  }, [id, category?._id, userLocation]);

  if ((categoryLoading || loading) && !products.length && !category) {
    return null;
  }

  if (error && !products.length && !category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center bg-white">
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

  if (!category && !categoryLoading) {
    return (
      <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
          Category not found
        </h1>
        <p className="text-neutral-600 md:text-lg">
          The category you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white h-screen overflow-hidden">
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 flex-shrink-0">
        <div className="px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="text-base md:text-xl font-bold text-neutral-900">
              {category?.name || "Category"}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide bg-white">
        {products.length > 0 ? (
          <div className="px-3 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                  showHeartIcon={false}
                  showStockInfo={false}
                  showBadge={true}
                  showOptionsText={true}
                  categoryStyle={true}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 md:px-6 lg:px-8 py-8 md:py-12 text-center">
            <p className="text-neutral-500 md:text-lg">
              No products found in this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
