import { useState, useEffect, useMemo } from "react";
import {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "../../../services/api/admin/adminProductService";
import { uploadImage } from "../../../services/api/uploadService";
import CameraCapture from "../../../components/CameraCapture";
import {
  validateImageFile,
  validateImageRatio,
  createImagePreview,
} from "../../../utils/imageUpload";
import {
  getAvailableParents,
  validateParentChange,
  flattenCategoryTree,
} from "../../../utils/categoryUtils";
import {
  getHeaderCategoriesAdmin,
  HeaderCategory,
} from "../../../services/api/headerCategoryService";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCategoryData | UpdateCategoryData) => Promise<void>;
  category?: Category;
  parentCategory?: Category;
  mode: "create" | "edit" | "create-subcategory";
  allCategories: Category[];
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  parentCategory,
  mode,
  allCategories,
}: CategoryFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    image: "",
    order: 0,
    parentId: null as string | null,
    headerCategoryId: null as string | null,
    status: "Active" as "Active" | "Inactive",
    isBestseller: false,
    hasWarning: false,
    groupCategory: "",
    commissionRate: 0,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>(
    []
  );
  const [loadingHeaderCategories, setLoadingHeaderCategories] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showImageCamera, setShowImageCamera] = useState(false);

  // Flatten categories for search and parent selection
  const flatCategories = useMemo(
    () => flattenCategoryTree(allCategories),
    [allCategories]
  );

  // Get available parent categories
  const availableParents = getAvailableParents(
    category?._id || null,
    flatCategories
  );

  // Fetch header categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchHeaderCategories();
    }
  }, [isOpen]);

  const fetchHeaderCategories = async () => {
    try {
      setLoadingHeaderCategories(true);
      const categories = await getHeaderCategoriesAdmin();
      // Filter only Published header categories
      const publishedCategories = categories.filter(
        (cat) => cat.status === "Published"
      );
      setHeaderCategories(publishedCategories);
    } catch (error) {
      console.error("Error fetching header categories:", error);
      setHeaderCategories([]);
    } finally {
      setLoadingHeaderCategories(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && category) {
        // Pre-fill form with category data
        setFormData({
          name: category.name || "",
          image: category.image || "",
          order: category.order || 0,
          parentId: category.parentId || null,
          headerCategoryId: category.headerCategoryId || null,
          status: category.status || "Active",
          isBestseller: category.isBestseller || false,
          hasWarning: category.hasWarning || false,
          groupCategory: category.groupCategory || "",
          commissionRate: category.commissionRate || 0,
        });
        if (category.image) {
          setImagePreview(category.image);
        }
      } else if (mode === "create-subcategory" && parentCategory) {
        // Pre-fill parent for subcategory and inherit header category
        // Handle both populated object and string ID
        let inheritedHeaderCategoryId: string | null = null;
        if (parentCategory.headerCategoryId) {
          if (typeof parentCategory.headerCategoryId === "string") {
            inheritedHeaderCategoryId = parentCategory.headerCategoryId;
          } else if (
            typeof parentCategory.headerCategoryId === "object" &&
            parentCategory.headerCategoryId !== null
          ) {
            // It's populated, extract the _id
            inheritedHeaderCategoryId =
              (parentCategory.headerCategoryId as { _id?: string })._id || null;
          }
        }
        // Also check headerCategory field (if it exists as separate field)
        if (!inheritedHeaderCategoryId && parentCategory.headerCategory) {
          if (typeof parentCategory.headerCategory === "string") {
            inheritedHeaderCategoryId = parentCategory.headerCategory;
          } else if (
            typeof parentCategory.headerCategory === "object" &&
            parentCategory.headerCategory !== null
          ) {
            inheritedHeaderCategoryId = parentCategory.headerCategory._id;
          }
        }
        setFormData({
          name: "",
          image: "",
          order: 0,
          parentId: parentCategory._id,
          headerCategoryId: inheritedHeaderCategoryId,
          status: "Active",
          isBestseller: false,
          hasWarning: false,
          groupCategory: "",
          commissionRate: 0,
        });
      } else {
        // Reset form for new category
        setFormData({
          name: "",
          image: "",
          order: 0,
          parentId: null,
          headerCategoryId: null,
          status: "Active",
          isBestseller: false,
          hasWarning: false,
          groupCategory: "",
          commissionRate: 0,
        });
      }
      setImageFile(null);
      setImagePreview(mode === "edit" && category?.image ? category.image : "");
      setErrors({});
      setShowAdvanced(false);
    }
  }, [isOpen, mode, category, parentCategory]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? parseInt(value) || 0
            : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleCameraCapture = (file: File) => {
    void processFile(file);
  };

  const processFile = async (file: File) => {
    // 1. Type + size check
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, image: validation.error || "Invalid image file" }));
      return;
    }

    // 2. 16:9 ratio check — only accepted size for category images
    const ratioCheck = await validateImageRatio(file);
    if (!ratioCheck.valid) {
      setErrors((prev) => ({ ...prev, image: ratioCheck.error || "Invalid image ratio" }));
      return;
    }

    setImageFile(file);
    setErrors((prev) => { const e = { ...prev }; delete e.image; return e; });

    try {
      const preview = await createImagePreview(file);
      setImagePreview(preview);
    } catch {
      setErrors((prev) => ({ ...prev, image: "Failed to create image preview" }));
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      let imageUrl = formData.image;

      // Upload image if a new file is selected
      if (imageFile) {
        setUploading(true);
        const imageResult = await uploadImage(imageFile, "dhakadsnazzy/categories");
        imageUrl = imageResult.secureUrl;
        setUploading(false);
      }

      const submitData: CreateCategoryData | UpdateCategoryData = {
        name: formData.name.trim(),
        image: imageUrl,
        order: formData.order,
        parentId: formData.parentId,
        headerCategoryId: formData.headerCategoryId,
        status: formData.status,
        isBestseller: formData.isBestseller,
        hasWarning: formData.hasWarning,
        groupCategory: formData.groupCategory || undefined,
        commissionRate: formData.commissionRate,
      };

      await onSubmit(submitData);
      onClose();
    } catch (error: any) {
      setErrors({
        submit:
          error.response?.data?.message ||
          error.message ||
          "Failed to save category. Please try again.",
      });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle =
    mode === "edit"
      ? "Edit Category"
      : mode === "create-subcategory"
        ? "Create Subcategory"
        : "Create Category";

  const isSubcategoryMode = mode === "create-subcategory";
  const isEditMode = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            disabled={submitting}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {/* Parent Category Info (for subcategory mode) */}
          {isSubcategoryMode && parentCategory && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600">Parent Category</p>
              <p className="text-base font-semibold text-blue-900">
                {parentCategory.name}
              </p>
            </div>
          )}

          {/* Error Messages */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Category Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => {
                // Allow only alphabets and spaces
                const v = e.target.value;
                if (/^[a-zA-Z\s]*$/.test(v)) handleInputChange(e);
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.name ? "border-red-300" : "border-neutral-300"
                }`}
              placeholder="Enter category name (alphabets only)"
              disabled={submitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>



          {/* Category Image */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-700">
                Category Image
              </label>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded px-2 py-0.5">
                Required: 16:9 ratio · e.g. 1200×675 px
              </span>
            </div>

            {/* Upload area */}
            <label
              className={`block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragging ? "border-teal-500 bg-teal-50" : "border-neutral-300 hover:border-teal-500"}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}>
              <div className="flex flex-col items-center gap-1.5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-xs text-neutral-600 font-medium">
                  {isDragging ? "Drop image here" : "Choose File or Drag & Drop"}
                </p>
                <p className="text-[11px] text-neutral-400">JPG · PNG · WEBP · Max 5MB · 16:9 only</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={submitting || uploading}
              />
            </label>

            {/* Camera button */}
            <button
              type="button"
              onClick={() => setShowImageCamera(true)}
              disabled={submitting || uploading}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25a2.25 2.25 0 012.25-2.25h1.046c.625 0 1.198-.353 1.477-.911.323-.646.997-1.09 1.777-1.09h2.4c.78 0 1.454.444 1.777 1.09a1.65 1.65 0 001.477.911h1.046a2.25 2.25 0 012.25 2.25v8.25a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V8.25z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              Use Camera
            </button>

            {errors.image && (
              <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errors.image}</p>
            )}

            {/* Preview — shown once a valid image is selected */}
            {imagePreview && (
              <div className="mt-4 space-y-3">

                {/* 16:9 image preview */}
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Image Preview (16:9)</p>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <img
                      src={imagePreview}
                      alt="Category preview"
                      className="absolute inset-0 w-full h-full object-cover object-top rounded-xl border border-neutral-200"
                    />
                  </div>
                </div>

                {/* Card preview — how it looks in the PromoStrip card */}
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Card Preview</p>
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow overflow-hidden max-w-[260px]">
                    {/* card image */}
                    <div className="relative w-full" style={{ paddingBottom: '57%' }}>
                      <img
                        src={imagePreview}
                        alt="Card image"
                        className="absolute inset-0 w-full h-full object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent opacity-40 pointer-events-none" />
                      <span className="absolute top-2 left-2 bg-white/95 text-[#002D4A] text-[9px] font-bold px-2 py-0.5 rounded-md shadow">
                        Up to 55% OFF
                      </span>
                    </div>
                    {/* card content */}
                    <div className="p-3">
                      <p className="text-[13px] font-black text-[#002D4A] uppercase leading-tight line-clamp-2 min-h-[34px]">
                        {formData.name || "Category Name"}
                      </p>
                      <p className="text-[11px] text-[#003B5C]/60 mt-1 line-clamp-1">
                        Explore our premium {formData.name || "category"} range.
                      </p>
                      <div className="mt-2 bg-[#072F4A] text-white text-[11px] font-bold py-1.5 rounded-lg text-center">
                        Explore →
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                    setFormData((prev) => ({ ...prev, image: "" }));
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium">
                  ✕ Remove image
                </button>
              </div>
            )}
          </div>


        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            disabled={submitting}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${submitting || uploading
              ? "bg-neutral-400 cursor-not-allowed"
              : "bg-teal-600 hover:bg-teal-700"
              }`}>
            {submitting
              ? "Saving..."
              : uploading
                ? "Uploading..."
                : isEditMode
                  ? "Update Category"
                  : "Create Category"}
          </button>
        </div>
      </div>

      {showImageCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowImageCamera(false)}
        />
      )}
    </div>
  );
}
