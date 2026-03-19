import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts,
  deleteProduct,
  Product,
  ProductVariation,
} from "../../../services/api/productService";
import {
  getCategories,
} from "../../../services/api/categoryService";
import { useAuth } from "../../../context/AuthContext";
import ProductLabelCard from "../components/ProductLabelCard";

// ... (interfaces remain same)

type FishGroupKey = "aqua-fish" | "marine-fish" | "bangali-fish";

interface CategoryFilterOption {
  id: FishGroupKey;
  name: string;
}

const toFishGroupKey = (name: string, slug: string = ""): FishGroupKey | null => {
  const joined = `${name || ""} ${slug || ""}`.toLowerCase();
  if (
    joined.includes("aqua") ||
    joined.includes("freshwater") ||
    joined.includes("river")
  ) {
    return "aqua-fish";
  }
  if (
    joined.includes("marine") ||
    joined.includes("marin") ||
    joined.includes("ocean") ||
    joined.includes("sea")
  ) {
    return "marine-fish";
  }
  if (
    joined.includes("bangali") ||
    joined.includes("bengali") ||
    joined.includes("bengoli") ||
    joined.includes("traditional")
  ) {
    return "bangali-fish";
  }
  return null;
};

export default function WarehouseProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Products");
  const [stockFilter, setStockFilter] = useState("All Products");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set()
  );
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [totalPages, setTotalPages] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryFilterOption[]>([]);
  const { user } = useAuth();

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          const groups = new Set<FishGroupKey>();
          for (const cat of response.data || []) {
            const key = toFishGroupKey((cat as any).name || "", (cat as any).slug || "");
            if (key) groups.add(key);
          }

          const ordered = (["aqua-fish", "marine-fish", "bangali-fish"] as FishGroupKey[])
            .filter((key) => groups.has(key))
            .map((key) => ({
              id: key,
              name:
                key === "aqua-fish"
                  ? "Aqua Fish"
                  : key === "marine-fish"
                  ? "Marine Fish"
                  : "Bengali Fish",
            }));

          setAllCategories(ordered);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCats();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const params: any = {
        page: currentPage,
        limit: rowsPerPage,
        sortBy: sortColumn || "createdAt",
        sortOrder: sortDirection,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }
      if (categoryFilter) {
        params.category = categoryFilter;
      }
      if (statusFilter === "Published") {
        params.status = "published";
      } else if (statusFilter === "Unpublished") {
        params.status = "unpublished";
      }
      if (stockFilter === "In Stock") {
        params.stock = "inStock";
      } else if (stockFilter === "Out of Stock") {
        params.stock = "outOfStock";
      }

      const response = await getProducts(params);
      if (response.success && response.data) {
        setProducts(response.data || []);
        // Extract pagination info if available
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
          setPaginationInfo(response.pagination);
        } else {
          // Fallback: calculate pages from data length if pagination not available
          setTotalPages(Math.ceil(response.data.length / rowsPerPage));
          setPaginationInfo(null);
        }
      } else {
        setError(response.message || "Failed to fetch products");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    rowsPerPage,
    searchTerm,
    categoryFilter,
    statusFilter,
    stockFilter,
    sortColumn,
    sortDirection,
  ]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [selectedProductForLabel, setSelectedProductForLabel] = useState<any>(null);

  const handleDeleteClick = (productId: string) => {
    setDeleteError("");
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setProductToDelete(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!productToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError("");
      const response = await deleteProduct(productToDelete);
      if (
        response.success ||
        response.message === "Product deleted successfully"
      ) {
        await fetchProducts();
        closeDeleteModal();
      } else {
        setDeleteError(response.message || "Failed to delete product");
      }
    } catch (error: any) {
      setDeleteError(
        error?.response?.data?.message || "Error deleting product"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (productId: string) => {
    navigate(`/Warehouse/product/edit/${productId}`);
  };

  // ... (rest of logic: flatten, filter, sort)

  const formatCategoryName = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("aqua") || n.includes("freshwater") || n.includes("river")) return "Aqua Fish";
    if (n.includes("marine") || n.includes("marin") || n.includes("ocean") || n.includes("sea")) return "Marine Fish";
    if (n.includes("bangali") || n.includes("bengali") || n.includes("bengoli") || n.includes("traditional")) return "Bengali Fish";
    return name;
  };

  // Flatten products with variations for display
  // Handle products with no variations by creating a default variation entry
  const allVariations = products.flatMap((product) => {
    // If product has no variations, create a default one
    if (!product.variations || product.variations.length === 0) {
      return [{
        variationId: `${product._id}-default`,
        productName: product.productName,
        WarehouseName: user?.storeName || "",
        productImage:
          product.mainImage ||
          product.mainImageUrl ||
          "/assets/product-placeholder.jpg",
        brandName: (product.brand as any)?.name || "-",
        category: formatCategoryName((product.category as any)?.name || "-"),
        subCategory: (product.subcategory as any)?.name || "-",
        price: (product as any).price || 0,
        discPrice: (product as any).discPrice || 0,
        variation: "Default",
        isPopular: product.popular,
        productId: product._id,
        productTag: (product as any).product_tag || "N/A",
      }];
    }
    // If product has variations, map them
    return product.variations.map((variation, index) => ({
      variationId: variation._id || `${product._id}-${index}`,
      productName: product.productName,
      WarehouseName: user?.storeName || "",
      productImage:
        product.mainImage ||
        product.mainImageUrl ||
        "/assets/product-placeholder.jpg",
      brandName: (product.brand as any)?.name || "-",
      category: formatCategoryName((product.category as any)?.name || "-"),
      subCategory: (product.subcategory as any)?.name || "-",
      price: variation.price,
      discPrice: variation.discPrice,
      variation:
        variation.title || variation.value || variation.name || "Default",
      isPopular: product.popular,
      productId: product._id,
      productTag: (product as any).product_tag || "N/A",
    }));
  });

  // Filter variations
  // Since we are using server-side filtering (triggered by useEffect dependencies), 
  // the 'products' array is already filtered by the backend.
  // We should not filter again on the client side as it may hide valid results 
  // (e.g., if backend search matches fields not available in the frontend model).
  let filteredVariations = allVariations;

  // Sort variations
  if (sortColumn) {
    filteredVariations.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof typeof a];
      let bVal: any = b[sortColumn as keyof typeof b];
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  // When using API pagination, don't do client-side pagination on already-paginated results
  // The API already returns the correct page of products, so we use all filtered variations
  // Only do client-side pagination if we don't have server-side pagination info
  const useServerPagination = totalPages > 1 && paginationInfo !== null;
  const displayTotalPages = useServerPagination
    ? totalPages
    : Math.ceil(filteredVariations.length / rowsPerPage);

  // Calculate start and end indices for display
  const startIndex = useServerPagination
    ? (paginationInfo!.page - 1) * paginationInfo!.limit
    : (currentPage - 1) * rowsPerPage;
  const endIndex = useServerPagination
    ? Math.min(startIndex + paginationInfo!.limit, paginationInfo!.total)
    : Math.min(currentPage * rowsPerPage, filteredVariations.length);

  // Only slice if NOT using server pagination (i.e., all data is loaded)
  const displayedVariations = useServerPagination
    ? filteredVariations
    : filteredVariations.slice(startIndex, endIndex);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const toggleProduct = (productId: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const SortIcon = ({ column }: { column: string }) => (
    <span className="text-neutral-300 text-[10px]">
      {sortColumn === column ? (sortDirection === "asc" ? "↑" : "↓") : "⇅"}
    </span>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-neutral-800">
          Product List
        </h1>
        <div className="text-sm text-blue-500">
          <span className="cursor-pointer hover:underline">Home</span>{" "}
          <span className="text-neutral-400">/</span>{" "}
          <span className="text-neutral-600">Dashboard</span>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex-1 flex flex-col">
        <div className="p-4 border-b border-neutral-100 font-medium text-neutral-700">
          View Product List
        </div>

        {/* Filters and Controls */}
        <div className="p-4 flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center justify-between border-b border-neutral-100">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs text-neutral-600 mb-1">
                Filter By Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-neutral-300 rounded py-1.5 px-3 text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer">
                <option value="">All Category</option>
                {allCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-neutral-300 rounded py-1.5 px-3 text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer">
                <option value="All Products">All Products</option>
                <option value="Published">Published</option>
                <option value="Unpublished">Unpublished</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1">
                Filter by Stock
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="bg-white border border-neutral-300 rounded py-1.5 px-3 text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer">
                <option value="All Products">All Products</option>
                <option value="In Stock">In Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Show</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="bg-white border border-neutral-300 rounded py-1.5 px-3 text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <button
              onClick={() => {
                const headers = [
                  "Product Id",
                  "Variation Id",
                  "Product Name",
                  "Warehouse Name",
                  "Brand Name",
                  "Category",
                  "Price",
                  "Disc Price",
                  "Variation",
                ];
                const csvContent = [
                  headers.join(","),
                  ...filteredVariations.map((v) =>
                    [
                      v.productId,
                      v.variationId,
                      `"${v.productName}"`,
                      `"${v.WarehouseName}"`,
                      `"${v.brandName}"`,
                      `"${v.category}"`,
                      v.price,
                      v.discPrice,
                      `"${v.variation}"`,
                    ].join(",")
                  ),
                ].join("\n");
                const blob = new Blob([csvContent], {
                  type: "text/csv;charset=utf-8;",
                });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute(
                  "download",
                  `products_${new Date().toISOString().split("T")[0]}.csv`
                );
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition-colors">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">
                Search:
              </span>
              <input
                type="text"
                className="pl-14 pr-3 py-1.5 bg-neutral-100 border-none rounded text-sm focus:ring-1 focus:ring-teal-500 w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center text-neutral-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
            Loading products...
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-8 text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse border border-neutral-200">
              <thead>
                <tr className="bg-neutral-50 text-xs font-bold text-neutral-800">
                  <th className="p-4 w-16 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      Product Id
                    </div>
                  </th>
                  <th className="p-4 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      Tag
                    </div>
                  </th>
                  <th
                    className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort("variationId")}>
                    <div className="flex items-center justify-between">
                      Variation Id <SortIcon column="variationId" />
                    </div>
                  </th>
                  <th
                    className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort("productName")}>
                    <div className="flex items-center justify-between">
                      Product Name <SortIcon column="productName" />
                    </div>
                  </th>
                  <th
                    className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort("WarehouseName")}>
                    <div className="flex items-center justify-between">
                      Warehouse Name <SortIcon column="WarehouseName" />
                    </div>
                  </th>
                  <th className="p-4 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      product Image
                    </div>
                  </th>
                  <th
                    className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort("brandName")}>
                    <div className="flex items-center justify-between">
                      Brand Name <SortIcon column="brandName" />
                    </div>
                  </th>
                  <th
                    className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort("category")}>
                    <div className="flex items-center justify-between">
                      Category <SortIcon column="category" />
                    </div>
                  </th>
                  <th
                    className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort("subCategory")}>
                    <div className="flex items-center justify-between">
                      SubCategory <SortIcon column="subCategory" />
                    </div>
                  </th>
                  <th
                    className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort("price")}>
                    <div className="flex items-center justify-between">
                      Price <SortIcon column="price" />
                    </div>
                  </th>
                  <th
                    className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort("discPrice")}>
                    <div className="flex items-center justify-between">
                      Disc Price <SortIcon column="discPrice" />
                    </div>
                  </th>
                  <th
                    className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort("variation")}>
                    <div className="flex items-center justify-between">
                      Variation <SortIcon column="variation" />
                    </div>
                  </th>
                  <th className="p-4 border border-neutral-200 sticky right-0 z-10 bg-neutral-50 min-w-[170px]">
                    <div className="flex items-center justify-center">Action</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedVariations.map((variation, index) => {
                  const isFirstVariation =
                    index === 0 ||
                    displayedVariations[index - 1].productId !==
                    variation.productId;
                  const product = products.find(
                    (p) => p._id === variation.productId
                  );
                  const hasMultipleVariations =
                    product && product.variations.length > 1;
                  const isExpanded = expandedProducts.has(variation.productId);

                  return (
                    <tr
                      key={`${variation.productId}-${variation.variationId}`}
                      className="group hover:bg-neutral-50 transition-colors text-sm text-neutral-700">
                      <td className="p-4 align-middle border border-neutral-200">
                        <div className="flex items-center gap-2">
                          {isFirstVariation && hasMultipleVariations && (
                            <button
                              onClick={() => toggleProduct(variation.productId)}
                              className="text-blue-600 hover:text-blue-700">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round">
                                {isExpanded ? (
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                ) : (
                                  <polyline points="9 18 15 12 9 6"></polyline>
                                )}
                              </svg>
                            </button>
                          )}
                          <span>{variation.productId}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        <button
                          onClick={() => {
                            setSelectedProductForLabel(variation);
                            setLabelModalOpen(true);
                          }}
                          className="bg-teal-50 px-2 py-1 rounded text-teal-700 font-mono text-xs border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
                          title="Click to view/print label"
                        >
                          {variation.productTag}
                        </button>
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        <span className="text-neutral-500 text-xs truncate max-w-[100px] block">
                          {variation.variationId}
                        </span>
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        <div className="flex flex-col gap-1">
                          <span>{variation.productName}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        {variation.WarehouseName}
                      </td>
                      <td className="p-4 border border-neutral-200">
                        <div className="w-16 h-12 bg-white border border-neutral-200 rounded p-1 flex items-center justify-center mx-auto">
                          <img
                            src={variation.productImage}
                            alt={variation.productName}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/60x40?text=Img";
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        {variation.brandName || "-"}
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        {variation.category}
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        {variation.subCategory}
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        ₹{variation.price.toFixed(2)}
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        {variation.discPrice > 0
                          ? `₹${variation.discPrice.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        {variation.variation}
                      </td>
                      <td className="p-4 align-middle border border-neutral-200 sticky right-0 bg-white group-hover:bg-neutral-50 min-w-[170px]">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(variation.productId)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Product">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProductForLabel(variation);
                              setLabelModalOpen(true);
                            }}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                            title="Generate Tag/Label">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                              <line x1="7" y1="8" x2="17" y2="8"></line>
                              <line x1="7" y1="12" x2="17" y2="12"></line>
                              <line x1="7" y1="16" x2="12" y2="16"></line>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(variation.productId)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 rounded transition-colors"
                            title="Delete Product">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            <span className="text-xs font-semibold">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {displayedVariations.length === 0 && (
                  <tr>
                    <td
                      colSpan={13}
                      className="p-8 text-center text-neutral-400 border border-neutral-200">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && !error && (
          <div className="px-4 sm:px-6 py-3 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-neutral-700">
              Showing {startIndex + 1} to {endIndex} of{" "}
              {useServerPagination && paginationInfo
                ? paginationInfo.total
                : filteredVariations.length}{" "}
              entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`min-w-[36px] h-[36px] flex items-center justify-center border border-teal-600 rounded transition-colors ${currentPage === 1
                  ? "text-neutral-300 border-neutral-200 cursor-not-allowed"
                  : "text-teal-600 hover:bg-teal-50"
                  }`}
                aria-label="Previous page">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="flex gap-2">
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5;

                  if (displayTotalPages <= maxVisiblePages) {
                    for (let i = 1; i <= displayTotalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    if (currentPage <= 3) {
                      for (let i = 1; i <= 4; i++) pages.push(i);
                      pages.push("...");
                      pages.push(displayTotalPages);
                    } else if (currentPage >= displayTotalPages - 2) {
                      pages.push(1);
                      pages.push("...");
                      for (let i = displayTotalPages - 3; i <= displayTotalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      pages.push("...");
                      pages.push(currentPage - 1);
                      pages.push(currentPage);
                      pages.push(currentPage + 1);
                      pages.push("...");
                      pages.push(displayTotalPages);
                    }
                  }

                  return pages.map((page, idx) => {
                    if (page === "...") {
                      return (
                        <span key={`ellipsis-${idx}`} className="flex items-end justify-center px-1 text-neutral-400">
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(Number(page))}
                        className={`min-w-[36px] h-[36px] flex items-center justify-center border rounded text-sm font-medium transition-colors ${currentPage === page
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "border-teal-600 text-teal-600 hover:bg-teal-50"
                          }`}>
                        {page}
                      </button>
                    );
                  });
                })()}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(displayTotalPages, prev + 1))
                }
                disabled={currentPage === displayTotalPages}
                className={`min-w-[36px] h-[36px] flex items-center justify-center border border-teal-600 rounded transition-colors ${currentPage === displayTotalPages
                  ? "text-neutral-300 border-neutral-200 cursor-not-allowed"
                  : "text-teal-600 hover:bg-teal-50"
                  }`}
                aria-label="Next page">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden transform transition-all scale-100 opacity-100">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-600">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                Delete Product?
              </h3>
              <p className="text-neutral-600 mb-6">
                Are you sure you want to delete this product? This action cannot be
                undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                  {isDeleting ? "Deleting..." : "Delete Product"}
                </button>
              </div>
              {deleteError && (
                <p className="mt-4 text-sm text-red-600">{deleteError}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Tag / Label Modal */}
      {labelModalOpen && selectedProductForLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                Product Tag & Label
              </h3>
              <button 
                onClick={() => setLabelModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-8 max-h-[70vh] overflow-y-auto bg-neutral-100 flex justify-center">
              <ProductLabelCard 
                name={selectedProductForLabel.productName}
                tag={selectedProductForLabel.productTag}
                category={selectedProductForLabel.category}
                warehouse={selectedProductForLabel.WarehouseName}
                variation={selectedProductForLabel.variation}
              />
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end gap-3 bg-white no-print">
              <button
                onClick={() => setLabelModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
