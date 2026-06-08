import { useState, useEffect } from "react";
import { uploadImage } from "../../../services/api/uploadService";
import CameraCapture from "../../../components/CameraCapture";
import {
  validateImageFile,
  createImagePreview,
} from "../../../utils/imageUpload";
import {
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getCategories,
  type SubCategory,
  type Category,
} from "../../../services/api/admin/adminProductService";
import { useAuth } from "../../../context/AuthContext";

export default function AdminSubCategory() {
  const { isAuthenticated, token } = useAuth();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryImageFile, setSubcategoryImageFile] = useState<File | null>(
    null
  );
  const [subcategoryImagePreview, setSubcategoryImagePreview] =
    useState<string>("");
  const [subcategoryImageUrl, setSubcategoryImageUrl] = useState<string>("");
  const [showSubcategoryImageCamera, setShowSubcategoryImageCamera] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subCatMessage, setSubCatMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [confirmDeleteSubCatId, setConfirmDeleteSubCatId] = useState<string | null>(null);
  const showSubCatMsg = (text: string, type: 'success' | 'error') => { setSubCatMessage({ text, type }); setTimeout(() => setSubCatMessage(null), 3000); };

  // Fetch categories and subcategories on component mount
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories for dropdown
        const categoriesResponse = await getCategories();
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        }

        // Fetch subcategories
        const params: any = { search: searchTerm };
        if (selectedCategory) {
          params.category = selectedCategory;
        }

        const response = await getSubCategories(params);
        if (response.success) {
          setSubCategories(response.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (err && typeof err === "object" && "response" in err) {
          const axiosError = err as {
            response?: { data?: { message?: string } };
          };
          setError(
            axiosError.response?.data?.message ||
            "Failed to load data. Please try again."
          );
        } else {
          setError("Failed to load data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, token, searchTerm, selectedCategory]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Backend handles filtering, so we just use the subCategories directly
  const totalPages = Math.ceil(subCategories.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedSubCategories = subCategories.slice(startIndex, endIndex);

  const processSubcategoryImageFile = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || "Invalid image file");
      return;
    }

    setSubcategoryImageFile(file);
    setUploadError("");

    try {
      const preview = await createImagePreview(file);
      setSubcategoryImagePreview(preview);
    } catch (error) {
      setUploadError("Failed to create image preview");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSubcategoryImageFile(file);
  };

  const handleSubcategoryImageCameraCapture = (file: File) => {
    void processSubcategoryImageFile(file);
  };

  const handleAddSubCategory = async () => {
    if (!selectedCategory) {
      setUploadError("Please select a category");
      return;
    }
    if (!subcategoryName.trim()) {
      setUploadError("Please enter a subcategory name");
      return;
    }
    if (!subcategoryImageFile && !editingId) {
      setUploadError("Subcategory image is required");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      let imageUrl = subcategoryImageUrl;

      // Upload subcategory image if a new file is selected
      if (subcategoryImageFile) {
        const imageResult = await uploadImage(
          subcategoryImageFile,
          "dhakadsnazzy/subcategories"
        );
        imageUrl = imageResult.secureUrl;
      }

      const subCategoryData = {
        name: subcategoryName.trim(),
        category: selectedCategory,
        image: imageUrl,
      };

      if (editingId) {
        // Update existing subcategory
        const response = await updateSubCategory(editingId, subCategoryData);
        if (response.success) {
          setSubCategories((prev) =>
            prev.map((sub) => (sub._id === editingId ? response.data : sub))
          );
          showSubCatMsg("SubCategory updated successfully!", 'success');
          setEditingId(null);
        }
      } else {
        // Create new subcategory
        const response = await createSubCategory(subCategoryData);
        if (response.success) {
          setSubCategories((prev) => [...prev, response.data]);
          showSubCatMsg("SubCategory added successfully!", 'success');
        }
      }

      // Reset form
      setSelectedCategory("");
      setSubcategoryName("");
      setSubcategoryImageFile(null);
      setSubcategoryImagePreview("");
      setSubcategoryImageUrl("");
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        setUploadError(
          axiosError.response?.data?.message ||
          "Failed to save subcategory. Please try again."
        );
      } else {
        setUploadError("Failed to save subcategory. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (id: string) => {
    const subCategory = subCategories.find((cat) => cat._id === id);
    if (subCategory) {
      setEditingId(id);
      const categoryId =
        typeof subCategory.category === "object"
          ? subCategory.category._id
          : subCategory.category;
      setSelectedCategory(categoryId);
      setSubcategoryName(subCategory.name);
      setSubcategoryImageUrl(subCategory.image || "");
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteSubCatId(id);
  };

  const handleConfirmDeleteSubCat = async () => {
    if (!confirmDeleteSubCatId) return;
    const id = confirmDeleteSubCatId;
    setConfirmDeleteSubCatId(null);
    try {
      const response = await deleteSubCategory(id);
      if (response.success) {
        setSubCategories((prev) => prev.filter((sub) => sub._id !== id));
        showSubCatMsg("SubCategory deleted successfully!", 'success');
      }
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        showSubCatMsg(axiosError.response?.data?.message || "Failed to delete subcategory. Please try again.", 'error');
      } else {
        showSubCatMsg("Failed to delete subcategory. Please try again.", 'error');
      }
    }
  };

  const handleExport = () => {
    // Export functionality placeholder
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Inline Message */}
      {subCatMessage && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${subCatMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {subCatMessage.text}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-2xl font-semibold text-neutral-800">SubCategory</h1>
        <div className="text-sm text-blue-500">
          <span className="text-blue-500 hover:underline cursor-pointer">
            Home
          </span>{" "}
          <span className="text-neutral-400">/</span> Dashboard
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Panel - Add SubCategory */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
            <h2 className="text-base sm:text-lg font-semibold">
              Add SubCategory
            </h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {uploadError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {uploadError}
              </div>
            )}
            {/* Select Category */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                disabled={uploading}>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SubCategory Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                SubCategory Name:
              </label>
              <input
                type="text"
                value={subcategoryName}
                onChange={(e) => setSubcategoryName(e.target.value)}
                placeholder="Enter Category Name"
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                disabled={uploading}
              />
            </div>

            {/* Commission Rate - Input Removed as only SubSubCategory allows this now */}
            {/* SubCategory Image */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                SubCategory Image:
              </label>
              <label className="block border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center cursor-pointer hover:border-teal-500 transition-colors">
                {subcategoryImagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={subcategoryImagePreview}
                      alt="Subcategory preview"
                      className="max-h-32 mx-auto rounded-lg object-cover"
                    />
                    <p className="text-xs text-neutral-600">
                      {subcategoryImageFile?.name}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setSubcategoryImageFile(null);
                        setSubcategoryImagePreview("");
                      }}
                      className="text-xs text-red-600 hover:text-red-700">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mx-auto mb-2 text-neutral-400">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p className="text-xs text-neutral-600">Choose File</p>
                    <p className="text-xs text-neutral-500 mt-1">Max 5MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <button
                type="button"
                onClick={() => setShowSubcategoryImageCamera(true)}
                disabled={uploading}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25a2.25 2.25 0 012.25-2.25h1.046c.625 0 1.198-.353 1.477-.911.323-.646.997-1.09 1.777-1.09h2.4c.78 0 1.454.444 1.777 1.09a1.65 1.65 0 001.477.911h1.046a2.25 2.25 0 012.25 2.25v8.25a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V8.25z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                Use Camera
              </button>
            </div>

            {/* Add SubCategory Button */}
            <button
              onClick={handleAddSubCategory}
              disabled={uploading}
              className={`w-full py-2.5 rounded text-sm font-medium transition-colors ${uploading
                ? "bg-neutral-400 cursor-not-allowed text-white"
                : "bg-teal-600 hover:bg-teal-700 text-white"
                }`}>
              {uploading
                ? "Saving..."
                : editingId
                  ? "Update SubCategory"
                  : "Add SubCategory"}
            </button>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setSelectedCategory("");
                  setSubcategoryName("");
                  setSubcategoryImageFile(null);
                  setSubcategoryImagePreview("");
                  setSubcategoryImageUrl("");
                }}
                className="w-full py-2.5 rounded text-sm font-medium bg-neutral-200 hover:bg-neutral-300 text-neutral-700 transition-colors mt-2">
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - View SubCategory */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
            <h2 className="text-base sm:text-lg font-semibold">
              View SubCategory
            </h2>
          </div>

          {/* Controls */}
          <div className="p-4 sm:p-6 border-b border-neutral-200">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              {/* Entries Per Page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-700">Show</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-neutral-700">entries</span>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors">
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
                  strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {/* Search */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-700">Search:</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search..."
                  className="px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 min-w-[150px]"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                    onClick={() => handleSort("id")}>
                    <div className="flex items-center gap-2">
                      ID
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-neutral-400">
                        <path
                          d="M7 10L12 5L17 10M7 14L12 19L17 14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                    onClick={() => handleSort("categoryName")}>
                    <div className="flex items-center gap-2">
                      Category Name
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-neutral-400">
                        <path
                          d="M7 10L12 5L17 10M7 14L12 19L17 14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                    onClick={() => handleSort("subcategoryName")}>
                    <div className="flex items-center gap-2">
                      Subcategory Name
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-neutral-400">
                        <path
                          d="M7 10L12 5L17 10M7 14L12 19L17 14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Subcategory Image
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                    onClick={() => handleSort("totalProduct")}>
                    <div className="flex items-center gap-2">
                      Total Product
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-neutral-400">
                        <path
                          d="M7 10L12 5L17 10M7 14L12 19L17 14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 sm:px-6 py-8 text-center text-sm text-neutral-500">
                      Loading subcategories...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 sm:px-6 py-8 text-center text-sm text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : displayedSubCategories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 sm:px-6 py-8 text-center text-sm text-neutral-500">
                      No subcategories found
                    </td>
                  </tr>
                ) : (
                  displayedSubCategories.map((subCategory) => {
                    const categoryName =
                      typeof subCategory.category === "object"
                        ? subCategory.category.name
                        : categories.find((c) => c._id === subCategory.category)
                          ?.name || "Unknown";
                    return (
                      <tr key={subCategory._id} className="hover:bg-neutral-50">
                        <td className="px-4 sm:px-6 py-3 text-sm text-neutral-900">
                          {subCategory._id.slice(-6)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-neutral-900 font-medium">
                          {categoryName}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-neutral-900 font-medium">
                          {subCategory.name}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <div className="w-16 h-16 bg-neutral-100 rounded overflow-hidden flex items-center justify-center">
                            {subCategory.image ? (
                              <img
                                src={subCategory.image}
                                alt={subCategory.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            ) : (
                              <div className="text-xs text-neutral-400">
                                No Image
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-neutral-900">
                          {subCategory.totalProduct ?? 0}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(subCategory._id)}
                              className="p-1.5 bg-teal-50 hover:bg-green-200 text-[#0e7490] rounded transition-colors"
                              title="Edit">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(subCategory._id)}
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                              title="Delete">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 sm:px-6 py-3 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-neutral-700">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, subCategories.length)} of{" "}
              {subCategories.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`p-2 border border-neutral-300 rounded ${currentPage === 1
                  ? "text-neutral-400 cursor-not-allowed bg-neutral-50"
                  : "text-neutral-700 hover:bg-neutral-50"
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border border-neutral-300 rounded text-sm ${currentPage === page
                      ? "bg-teal-600 text-white border-teal-600"
                      : "text-neutral-700 hover:bg-neutral-50"
                      }`}>
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className={`p-2 border border-neutral-300 rounded ${currentPage === totalPages || totalPages === 0
                  ? "text-neutral-400 cursor-not-allowed bg-neutral-50"
                  : "text-neutral-700 hover:bg-neutral-50"
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
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-neutral-500 py-4">
        Copyright © 2026. Developed By{" "}
        <a href="#" className="text-teal-600 hover:text-teal-700">
          Inor fresh
        </a>
      </div>

      {/* Delete SubCategory Confirmation Modal */}
      {confirmDeleteSubCatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDeleteSubCatId(null)} />
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Delete SubCategory</h3>
            <p className="text-sm text-neutral-500 mb-6">Are you sure you want to delete this subcategory? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteSubCatId(null)}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteSubCat}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubcategoryImageCamera && (
        <CameraCapture
          onCapture={handleSubcategoryImageCameraCapture}
          onClose={() => setShowSubcategoryImageCamera(false)}
        />
      )}
    </div>
  );
}

