import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { uploadImage } from "../../../services/api/uploadService";
import { validateImageFile, createImagePreview, compressToSquare } from "../../../utils/imageUpload";
import { createProduct, updateProduct, getProductById, ProductVariation } from "../../../services/api/productService";
import { getSubcategories, SubCategory } from "../../../services/api/categoryService";
import api from "../../../services/api/config";
import ProductLabelCard from "../components/ProductLabelCard";
import CameraCapture from "../../../components/CameraCapture";
import { useAuth } from "../../../context/AuthContext";

interface Category {
  _id: string;
  name: string;
  image?: string;
  headerCategoryId?: any;
}

export default function WarehouseAddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const prefilledCategory = searchParams.get('category') || '';
  const prefilledCategoryName = searchParams.get('categoryName') || '';

  // ── Label Modal state ────────────────────────────────────────
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [newlyCreatedProduct, setNewlyCreatedProduct] = useState<any>(null);

  // ── Form state ───────────────────────────────────────────────
  const [formData, setFormData] = useState({
    productName: "",
    category: prefilledCategory,
    subcategory: "",
    publish: "Yes",
    smallDescription: "",
    totalAllowedQuantity: "10",
    mainImageUrl: "",
    // Base price/stock — creates default variation automatically
    basePrice: "",
    salePrice: "",
    baseStock: "0",
  });

  // ── Dropdown data ────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);

  // ── Variation (price / stock) ────────────────────────────────
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [variationForm, setVariationForm] = useState({
    title: "",
    price: "",
    discPrice: "0",
    stock: "0",
    status: "Available" as "Available" | "Sold out",
  });

  // ── Image ────────────────────────────────────────────────────
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>("");
  const [showMainImageCamera, setShowMainImageCamera] = useState(false);

  // ── Status ───────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ── Load categories ──────────────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories', { params: { status: 'Active' } });
        if (res.data.success) {
          const allCategories = res.data.data || [];
          setCategories(allCategories);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      getSubcategories(formData.category)
        .then(res => { if (res.success) setSubcategories(res.data); })
        .catch(err => console.error("Failed to fetch subcategories:", err));
    } else {
      setSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory: "" }));
    }
  }, [formData.category]);

  // Load product for edit mode
  useEffect(() => {
    if (id) {
      getProductById(id).then(res => {
        if (res.success && res.data) {
          const p = res.data as any;
          setFormData({
            productName: p.productName || "",
            category: (p.category as any)?._id || p.categoryId || "",
            subcategory: (p.subcategory as any)?._id || p.subcategoryId || "",
            publish: p.publish ? "Yes" : "No",
            smallDescription: p.smallDescription || "",
            totalAllowedQuantity: p.totalAllowedQuantity?.toString() || "10",
            mainImageUrl: p.mainImageUrl || p.mainImage || "",
            // Populate base price from first variation or product-level price
            basePrice: p.variations?.[0]?.price?.toString() || p.price?.toString() || "",
            salePrice: p.variations?.[0]?.discPrice?.toString() || p.discPrice?.toString() || "",
            baseStock: p.variations?.[0]?.stock?.toString() || p.stock?.toString() || "0",
          });
          // The backend stores the variant label in `value`, but the form/table
          // use `title` — map it across so the label shows on edit.
          setVariations(
            (p.variations || []).map((v: any) => ({
              ...v,
              title: v.title || v.value || "",
            }))
          );
          if (p.mainImageUrl || p.mainImage) {
            setMainImagePreview(p.mainImageUrl || p.mainImage || "");
          }
        }
      }).catch(err => { setUploadError("Failed to load product"); console.error(err); });
    }
  }, [id]);

  // ── Validation Helpers ──────────────────────────────────────
  // Only letters, numbers, spaces, hyphens, parentheses - MUST contain at least one letter
  const validateProductName = (value: string): boolean => {
    const nameRegex = /^[a-zA-Z0-9\s\-()\.&,]*$/;
    const hasAtLeastOneLetter = /[a-zA-Z]/.test(value);
    return nameRegex.test(value) && hasAtLeastOneLetter && value.length > 0 && value.length <= 100;
  };

  const validateNumber = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  };

  const validatePositiveInteger = (value: string): boolean => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0 && num <= 100;
  };

  // ── Helpers ──────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Apply validation for specific fields
    if (name === 'productName') {
      if (value.length > 0 && !validateProductName(value)) {
        return; // Don't update if invalid
      }
    }
    if (name === 'totalAllowedQuantity') {
      if (value && !validatePositiveInteger(value)) {
        return; // Don't update if invalid
      }
    }
    if (name === 'smallDescription' && value.length > 500) {
      return; // Limit description to 500 chars
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const processMainImageFile = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) { setUploadError(validation.error || "Invalid image"); return; }
    // Compress/resize large photos (e.g. from a phone camera) so the upload
    // stays under the backend's 5MB limit — otherwise the upload fails with a
    // "network error" on the app while small web images worked. Fall back to
    // the original file if compression fails for any reason.
    let compressed = file;
    try {
      compressed = await compressToSquare(file);
    } catch {
      compressed = file;
    }
    setMainImageFile(compressed);
    setUploadError("");
    try {
      const preview = await createImagePreview(compressed);
      setMainImagePreview(preview);
    } catch { setUploadError("Failed to preview image"); }
  };

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processMainImageFile(file);
  };

  const handleMainImageCameraCapture = (file: File) => {
    void processMainImageFile(file);
  };

  const addVariation = () => {
    // Validate variant label
    if (!variationForm.title.trim()) {
      setUploadError("Please enter a variant label (e.g. 500g, 1kg)");
      return;
    }
    if (!validateProductName(variationForm.title)) {
      if (!/[a-zA-Z]/.test(variationForm.title)) {
        setUploadError("Variant label must contain at least one letter (e.g. 500g, 1kg, Standard)");
      } else {
        setUploadError("Variant label can only contain letters, numbers, spaces, hyphens, and parentheses");
      }
      return;
    }

    // Validate price
    if (!variationForm.price || !validateNumber(variationForm.price)) {
      setUploadError("Please enter a valid price for this variant");
      return;
    }

    const price = parseFloat(variationForm.price);
    const discPrice = parseFloat(variationForm.discPrice || "0");
    const stock = parseInt(variationForm.stock || "0");

    // Validate sell price vs price
    if (discPrice > price) {
      setUploadError("Sell price cannot exceed original price");
      return;
    }

    // Validate stock
    if (stock < 0) {
      setUploadError("Stock cannot be negative");
      return;
    }

    setVariations(prev => [...prev, {
      title: variationForm.title, price, discPrice, stock, status: variationForm.status
    }]);
    setVariationForm({ title: "", price: "", discPrice: "0", stock: "0", status: "Available" });
    setUploadError("");
  };

  const removeVariation = (index: number) => setVariations(prev => prev.filter((_, i) => i !== index));

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");

    // Product Name validation
    if (!formData.productName.trim()) {
      setUploadError("Product name is required");
      return;
    }
    if (!validateProductName(formData.productName)) {
      if (!/[a-zA-Z]/.test(formData.productName)) {
        setUploadError("Product name must contain at least one letter");
      } else {
        setUploadError("Product name can only contain letters, numbers, spaces, hyphens, parentheses, dots, and ampersands");
      }
      return;
    }
    if (formData.productName.trim().length < 3) {
      setUploadError("Product name must be at least 3 characters");
      return;
    }

    // Category validation
    if (!formData.category) {
      setUploadError("Please select a category");
      return;
    }

    // Description validation (optional, but if provided, check length)
    if (formData.smallDescription && formData.smallDescription.length > 500) {
      setUploadError("Short description cannot exceed 500 characters");
      return;
    }

    // Max quantity validation
    if (!validatePositiveInteger(formData.totalAllowedQuantity)) {
      setUploadError("Max quantity per order must be between 1 and 100");
      return;
    }

    // Image validation
    if (!id && !mainImageFile) {
      setUploadError("Product image is required. Please choose a high-quality image.");
      return;
    }

    // Variants validation
    if (variations.length === 0) {
      setUploadError("Please add at least one product variant (e.g. 500g, 1kg) in the variants section below.");
      return;
    }

    // Validate all variations have valid data
    for (let i = 0; i < variations.length; i++) {
      const v = variations[i];
      if (!v.title || v.title.trim().length === 0) {
        setUploadError(`Variant ${i + 1}: Label is required`);
        return;
      }
      if (!validateNumber(v.price.toString()) || v.price <= 0) {
        setUploadError(`Variant ${i + 1}: Price must be greater than 0`);
        return;
      }
      if (v.discPrice > v.price) {
        setUploadError(`Variant ${i + 1}: Sell price cannot exceed original price`);
        return;
      }
      if (v.stock < 0) {
        setUploadError(`Variant ${i + 1}: Stock cannot be negative`);
        return;
      }
    }

    // Include `value` (the schema's label field) alongside `title` so the label
    // persists on BOTH create and update — the update endpoint doesn't map
    // title -> value, so without this an edit would wipe the variant label.
    const finalVariations = variations.map((v: any) => ({
      ...v,
      value: v.title || v.value || "",
    }));

    setUploading(true);
    try {
      let mainImageUrl = formData.mainImageUrl;

      if (mainImageFile) {
        const result = await uploadImage(mainImageFile, "zetomart/products");
        mainImageUrl = result.secureUrl;
      }

      const productData = {
        productName: formData.productName,
        categoryId: formData.category || undefined,
        subcategoryId: formData.subcategory || undefined,
        publish: formData.publish === "Yes",
        smallDescription: formData.smallDescription || undefined,
        totalAllowedQuantity: parseInt(formData.totalAllowedQuantity || "10"),
        mainImageUrl: mainImageUrl || undefined,
        galleryImageUrls: [],
        variations: finalVariations,
        tags: [],
        isReturnable: false,
        price: finalVariations[0].price,
        discPrice: finalVariations[0].discPrice > 0 ? finalVariations[0].discPrice : undefined,
        stock: finalVariations[0].stock,
      };

      const response = id
        ? await updateProduct(id, productData as any)
        : await createProduct(productData as any);

      if (response.success) {
        setSuccessMessage(id ? "Product updated successfully!" : "Product added successfully!");
        
        if (!id && response.data) {
          // If adding new, show the label modal
          setNewlyCreatedProduct(response.data);
          setLabelModalOpen(true);
        } else {
          // If editing, just go back
          setTimeout(() => {
            navigate(prefilledCategory
              ? `/warehouse/category`
              : "/warehouse/product/list");
          }, 1200);
        }
      } else {
        setUploadError(response.message || "Failed to save product");
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  // ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="bg-[#12b2a2] text-white p-6 rounded-lg shadow-sm mb-6 flex justify-between items-center transition-all">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(prefilledCategory ? '/warehouse/category' : '/warehouse/product/list')}
            className="flex items-center gap-1 text-teal-50 hover:text-white transition-colors text-sm font-bold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="h-8 w-px bg-teal-400 group-hover:bg-teal-300 transition-colors" />
          <h1 className="text-2xl font-bold">
            {id ? "Edit Product" : "Add New Product"}
          </h1>
        </div>
        <div className="text-sm font-medium">
          {prefilledCategoryName && (
            <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-full border border-white/30">
              📂 {prefilledCategoryName}
            </span>
          )}
        </div>
      </div>

      {/* Success / Error messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 text-[#0e7490] rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          {uploadError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Basic Info ──────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="bg-teal-600 text-white px-5 py-3">
            <h2 className="text-base font-semibold">Basic Information</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="e.g. Fresh Rohu Fish – 1kg pack"
                maxLength={100}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                  formData.productName && !validateProductName(formData.productName)
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : 'border-neutral-300 focus:ring-teal-500'
                }`}
              />
              {formData.productName && !validateProductName(formData.productName) && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700 font-medium">
                    {!/[a-zA-Z]/.test(formData.productName)
                      ? '⚠️ Product name must contain at least one letter'
                      : '⚠️ Only letters, numbers, spaces, hyphens, parentheses, dots and & are allowed'}
                  </p>
                </div>
              )}
              {formData.productName && formData.productName.length < 3 && validateProductName(formData.productName) && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-orange-700 font-medium">Name must be at least 3 characters</p>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Subcategory field removed per requirements */}

            {/* Short Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Short Description <span className="text-neutral-400 text-xs">(optional)</span>
              </label>
              <textarea
                name="smallDescription"
                value={formData.smallDescription}
                onChange={handleChange}
                placeholder="Brief description of the product..."
                rows={2}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {/* Publish & Max Quantity */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Publish Product?</label>
              <select
                name="publish"
                value={formData.publish}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Yes">Yes – Visible to customers</option>
                <option value="No">No – Draft / Hidden</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Max Quantity Per Order <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="totalAllowedQuantity"
                value={formData.totalAllowedQuantity}
                onChange={(e) => {
                  let val = e.target.value;
                  // Only allow digits
                  val = val.replace(/[^0-9]/g, '');
                  // Limit to 100
                  if (val && parseInt(val, 10) > 100) {
                    val = '100';
                  }
                  // Prevent leading zeros
                  if (val.length > 1 && val[0] === '0') {
                    val = val.substring(1);
                  }
                  setFormData(prev => ({ ...prev, totalAllowedQuantity: val }));
                }}
                placeholder="Enter 1-100"
                maxLength={3}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                  formData.totalAllowedQuantity && (parseInt(formData.totalAllowedQuantity, 10) < 1 || parseInt(formData.totalAllowedQuantity, 10) > 100)
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : 'border-neutral-300 focus:ring-teal-500'
                }`}
              />
              {formData.totalAllowedQuantity && (parseInt(formData.totalAllowedQuantity, 10) < 1 || parseInt(formData.totalAllowedQuantity, 10) > 100) && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700 font-medium">⚠️ Quantity must be between 1 and 100</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Product Image ────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="bg-teal-600 text-white px-5 py-3">
            <h2 className="text-base font-semibold">Product Image</h2>
          </div>
          <div className="p-5">
            <div className="flex items-start gap-5">
              {/* Preview */}
              <div className="w-28 h-28 bg-neutral-100 rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                {mainImagePreview ? (
                  <img src={mainImagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-neutral-400">
                    <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 9.75h.007M4.505 3h15c.828 0 1.5.672 1.5 1.5v15c0 .828-.672 1.5-1.5 1.5h-15A1.5 1.5 0 013 19.5v-15A1.5 1.5 0 014.5 3z" />
                    </svg>
                    <span className="text-xs">No image</span>
                  </div>
                )}
              </div>
              {/* Upload controls */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Upload Image <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-teal-50 border border-teal-300 text-teal-700 hover:bg-teal-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A1.5 1.5 0 004.5 20.25h15a1.5 1.5 0 001.5-1.5V16.5m-12-9l3-3m0 0l3 3m-3-3v12.25" />
                    </svg>
                     Choose Image
                    {/* Use explicit extensions (not image/*) so the OS opens the
                        file/gallery picker instead of a camera-first chooser. A
                        web file input can't fully remove the OS camera option, but
                        this avoids the camera prompt on most Android devices. */}
                    <input type="file" accept="image/*" className="hidden" onChange={handleMainImageChange} />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMainImageCamera(true)}
                    className="inline-flex items-center gap-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25a2.25 2.25 0 012.25-2.25h1.046c.625 0 1.198-.353 1.477-.911.323-.646.997-1.09 1.777-1.09h2.4c.78 0 1.454.444 1.777 1.09a1.65 1.65 0 001.477.911h1.046a2.25 2.25 0 012.25 2.25v8.25a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V8.25z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                    Camera
                  </button>
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  JPG, PNG, or WebP. Max 5MB.
                  <span className="block mt-1 text-[#12b2a2] font-semibold">📐 Best: 1080×1080 px — Square (1:1 ratio)</span>
                  <span className="block text-[11px] text-neutral-400">Non-square images will be auto center-cropped to square on upload.</span>
                </p>
                {mainImageFile && (
                  <p className="text-xs text-teal-600 mt-1">✓ {mainImageFile.name} selected</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Pricing & Variants ──────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="bg-teal-600 text-white px-5 py-3">
            <h2 className="text-base font-semibold">Pricing & Variants</h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Mandatory product variants section */}
            <div className="mt-6 border-t border-neutral-100 pt-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-800 mb-4">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Product Variants <span className="text-red-500">*</span>
                <span className="text-xs text-neutral-400 font-normal ml-2">Add at least one (e.g. 500g, 1kg, Standard)</span>
              </div>
              
              <div className="space-y-4">
                {/* Add variant form */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-teal-50/50 border border-teal-100 rounded-xl p-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Variant Label <span className="text-red-500">*</span>
                    </label>
                    <input type="text" placeholder="e.g. 500g"
                      value={variationForm.title}
                      onChange={e => setVariationForm(p => ({ ...p, title: e.target.value }))}
                      maxLength={50}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${
                        variationForm.title && !validateProductName(variationForm.title)
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-neutral-300 focus:ring-teal-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Price (₹)</label>
                    <input type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={variationForm.price}
                      onChange={e => {
                        let val = e.target.value;
                        // Only allow digits and decimal point
                        val = val.replace(/[^0-9.]/g, '');
                        // Remove leading zeros (but keep 0. pattern)
                        if (val && val[0] === '0' && val.length > 1 && val[1] !== '.') {
                          val = val.replace(/^0+/, '') || '0';
                        }
                        // Only allow one decimal point
                        const parts = val.split('.');
                        if (parts.length > 2) {
                          val = parts[0] + '.' + parts.slice(1).join('');
                        }
                        setVariationForm(p => ({ ...p, price: val }));
                      }}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${
                        variationForm.price && (parseFloat(variationForm.price) <= 0 || !validateNumber(variationForm.price))
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-neutral-300 focus:ring-teal-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Sell Price (₹)</label>
                    <input type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={variationForm.discPrice}
                      onChange={e => {
                        let val = e.target.value;
                        // Only allow digits and decimal point
                        val = val.replace(/[^0-9.]/g, '');
                        // Remove leading zeros (but keep 0. pattern)
                        if (val && val[0] === '0' && val.length > 1 && val[1] !== '.') {
                          val = val.replace(/^0+/, '') || '0';
                        }
                        // Only allow one decimal point
                        const parts = val.split('.');
                        if (parts.length > 2) {
                          val = parts[0] + '.' + parts.slice(1).join('');
                        }
                        setVariationForm(p => ({ ...p, discPrice: val }));
                      }}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${
                        variationForm.discPrice && (
                          (variationForm.price && parseFloat(variationForm.discPrice) > parseFloat(variationForm.price)) ||
                          !validateNumber(variationForm.discPrice)
                        )
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-neutral-300 focus:ring-teal-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Stock <span className="text-red-500">*</span></label>
                    <input type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={variationForm.stock}
                      onChange={e => {
                        let val = e.target.value;
                        // Only allow digits
                        val = val.replace(/[^0-9]/g, '');
                        // Remove leading zeros (but keep single 0)
                        if (val && val[0] === '0' && val.length > 1) {
                          val = val.replace(/^0+/, '');
                        }
                        setVariationForm(p => ({ ...p, stock: val }));
                      }}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white ${
                        variationForm.stock && (parseInt(variationForm.stock, 10) <= 0 || isNaN(parseInt(variationForm.stock, 10)))
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-neutral-300 focus:ring-teal-500'
                      }`}
                    />
                  </div>
                  {/* Validation Error Messages */}
                  <div className="col-span-2 sm:col-span-4 space-y-2">
                    {variationForm.title && !validateProductName(variationForm.title) && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-red-700">
                          {!/[a-zA-Z]/.test(variationForm.title)
                            ? 'Variant label must contain at least one letter'
                            : 'Only letters, numbers, spaces, hyphens, parentheses allowed'}
                        </p>
                      </div>
                    )}
                    {variationForm.price && !validateNumber(variationForm.price) && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-red-700">Price must be a valid number</p>
                      </div>
                    )}
                    {variationForm.price && parseFloat(variationForm.price) <= 0 && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-red-700">Price must be greater than 0</p>
                      </div>
                    )}
                    {variationForm.discPrice && parseFloat(variationForm.discPrice) <= 0 && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-red-700">Sell price must be greater than 0 (or leave blank)</p>
                      </div>
                    )}
                    {variationForm.discPrice && variationForm.price && parseFloat(variationForm.discPrice) > parseFloat(variationForm.price) && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-red-700">Sell price cannot exceed original price</p>
                      </div>
                    )}
                    {variationForm.stock && parseInt(variationForm.stock, 10) <= 0 && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-red-700">Stock must be greater than 0</p>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 sm:col-span-4">
                    <button type="button" onClick={addVariation}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Variant to List
                    </button>
                  </div>
                </div>

                {/* Extra variants table */}
                {variations.length > 0 ? (
                  <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                    <table className="w-full min-w-[480px] text-sm border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                          <th className="px-4 py-3 text-left border-b border-neutral-200">Label</th>
                          <th className="px-4 py-3 text-left border-b border-neutral-200">Price</th>
                          <th className="px-4 py-3 text-left border-b border-neutral-200">Sell Price</th>
                          <th className="px-4 py-3 text-left border-b border-neutral-200">Stock</th>
                          <th className="px-4 py-3 text-right border-b border-neutral-200">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {variations.map((v, i) => (
                          <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-neutral-800">{v.title}</td>
                            <td className="px-4 py-3 text-neutral-600 font-medium">₹{v.price.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              {v.discPrice > 0 ? (
                                <span className="text-teal-600 font-bold">₹{v.discPrice.toFixed(2)}</span>
                              ) : (
                                <span className="text-neutral-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${v.stock > 0 ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'}`}>
                                {v.stock} in stock
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button type="button" onClick={() => removeVariation(i)}
                                className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                                title="Remove variant"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 text-neutral-400">
                    <svg className="w-10 h-10 mb-2 opacity-20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-sm">No variants added yet. Please add at least one.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Submit ───────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate(prefilledCategory ? '/warehouse/category' : '/warehouse/product/list')}
            className="px-6 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !!successMessage}
            className={`px-8 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm ${uploading || successMessage
              ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              : 'bg-teal-700 hover:bg-teal-800 text-white hover:shadow-md'
              }`}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : successMessage ? '✓ Saved!' : id ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>

      {/* Post-Creation Label Modal */}
      {labelModalOpen && newlyCreatedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 opacity-100 animate-in zoom-in-95 duration-200">
            <div className="bg-teal-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Product Saved! Print Label?
              </h3>
              <button onClick={() => navigate("/warehouse/product/list")} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8 bg-neutral-50 flex justify-center">
              <ProductLabelCard 
                name={newlyCreatedProduct.productName}
                tag={newlyCreatedProduct.product_tag}
                category={categories.find(c => c._id === newlyCreatedProduct.category)?.name || "Aqua Fish"}
                warehouse={user?.storeName || "Main Warehouse"}
                variation="Standard"
              />
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end gap-3 bg-white">
              <button
                onClick={() => navigate("/warehouse/product/list")}
                className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
              >
                Go to Product List
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 transition-all shadow-sm flex items-center gap-2"
              >
                <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4" />
                </svg>
                Print Label Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showMainImageCamera && (
        <CameraCapture
          onCapture={handleMainImageCameraCapture}
          onClose={() => setShowMainImageCamera(false)}
        />
      )}
    </div>
  );
}
