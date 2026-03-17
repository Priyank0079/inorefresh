import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { uploadImage } from "../../../services/api/uploadService";
import { validateImageFile, createImagePreview } from "../../../utils/imageUpload";
import { createProduct, updateProduct, getProductById, ProductVariation } from "../../../services/api/productService";
import { getSubcategories, SubCategory } from "../../../services/api/categoryService";
import api from "../../../services/api/config";
import ProductLabelCard from "../components/ProductLabelCard";
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
          // User requested only three main fish categories
          const allowedCategories = allCategories.filter((cat: any) => {
            const name = (cat.name || "").toLowerCase();
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
          }).map((cat: any) => {
            const name = (cat.name || "").toLowerCase();
            // Force user-requested labels for the dropdown
            if (name.includes("aqua") || name.includes("freshwater") || name.includes("river")) {
              return { ...cat, name: "Aqua Fish" };
            }
            if (name.includes("marine") || name.includes("marin") || name.includes("ocean") || name.includes("sea")) {
              return { ...cat, name: "Marine Fish" };
            }
            if (name.includes("bangali") || name.includes("bengali") || name.includes("bengoli") || name.includes("traditional")) {
              return { ...cat, name: "Bengali Fish" };
            }
            return cat;
          });
          setCategories(allowedCategories);
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
          setVariations(p.variations || []);
          if (p.mainImageUrl || p.mainImage) {
            setMainImagePreview(p.mainImageUrl || p.mainImage || "");
          }
        }
      }).catch(err => { setUploadError("Failed to load product"); console.error(err); });
    }
  }, [id]);

  // ── Helpers ──────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { setUploadError(validation.error || "Invalid image"); return; }
    setMainImageFile(file);
    setUploadError("");
    try {
      const preview = await createImagePreview(file);
      setMainImagePreview(preview);
    } catch { setUploadError("Failed to preview image"); }
  };

  const addVariation = () => {
    if (!variationForm.title || !variationForm.price) {
      setUploadError("Please enter a variation title and price");
      return;
    }
    const price = parseFloat(variationForm.price);
    const discPrice = parseFloat(variationForm.discPrice || "0");
    const stock = parseInt(variationForm.stock || "0");
    if (discPrice > price) { setUploadError("Discounted price cannot exceed original price"); return; }
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

    if (!formData.productName.trim()) { setUploadError("Product name is required"); return; }
    if (!formData.category) { setUploadError("Please select a category"); return; }
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      setUploadError("Please enter a valid price");
      return;
    }

    // Build final variations list:
    // Always start with the base price/stock as a default variant
    const basePrice = parseFloat(formData.basePrice);
    const baseSalePrice = parseFloat(formData.salePrice || "0");
    const baseStock = parseInt(formData.baseStock || "0");

    // Default variation ("Standard" or use first existing variation name if editing)
    const defaultVariation: ProductVariation = {
      title: "Standard",
      price: basePrice,
      discPrice: baseSalePrice > 0 && baseSalePrice < basePrice ? baseSalePrice : 0,
      stock: baseStock,
      status: baseStock > 0 ? "Available" : "Sold out",
    };

    // Merge: default + any extra named variants the user added
    const finalVariations = [defaultVariation, ...variations];

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
        price: basePrice,
        discPrice: baseSalePrice > 0 ? baseSalePrice : undefined,
        stock: baseStock,
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(prefilledCategory ? '/warehouse/category' : '/warehouse/product/list')}
            className="flex items-center gap-1 text-teal-600 hover:text-teal-800 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-semibold text-neutral-800">
            {id ? "Edit Product" : "Add New Product"}
          </h1>
        </div>
        <div className="text-sm text-neutral-500">
          {prefilledCategoryName && (
            <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-medium">
              📂 {prefilledCategoryName}
            </span>
          )}
        </div>
      </div>

      {/* Success / Error messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 text-green-700 rounded-lg flex items-center gap-2">
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
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Subcategory <span className="text-neutral-400 text-xs">(optional)</span>
              </label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                disabled={!formData.category || subcategories.length === 0}
                className={`w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${!formData.category || subcategories.length === 0 ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-white'}`}
              >
                <option value="">{subcategories.length === 0 ? (formData.category ? 'No subcategories' : 'Select category first') : 'Select Subcategory'}</option>
                {subcategories.map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.subcategoryName}</option>
                ))}
              </select>
            </div>

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
                Max Quantity Per Order
              </label>
              <input
                type="number"
                name="totalAllowedQuantity"
                value={formData.totalAllowedQuantity}
                onChange={handleChange}
                min="1"
                max="100"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">Upload Image</label>
                <label className="cursor-pointer inline-flex items-center gap-2 bg-teal-50 border border-teal-300 text-teal-700 hover:bg-teal-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A1.5 1.5 0 004.5 20.25h15a1.5 1.5 0 001.5-1.5V16.5m-12-9l3-3m0 0l3 3m-3-3v12.25" />
                  </svg>
                  Choose Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleMainImageChange} />
                </label>
                <p className="text-xs text-neutral-400 mt-2">JPG, PNG, or WebP. Max 5MB.</p>
                {mainImageFile && (
                  <p className="text-xs text-teal-600 mt-1">✓ {mainImageFile.name} selected</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Pricing & Stock ──────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="bg-teal-600 text-white px-5 py-3">
            <h2 className="text-base font-semibold">Pricing & Stock</h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Simple required price / stock row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Sale Price (₹) <span className="text-neutral-400 text-xs">(optional)</span>
                </label>
                <input
                  type="number"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {formData.salePrice && formData.basePrice &&
                  parseFloat(formData.salePrice) > parseFloat(formData.basePrice) && (
                    <p className="text-xs text-red-500 mt-1">⚠ Sale price should be less than main price</p>
                  )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Stock (qty) <span className="text-neutral-400 text-xs">(optional)</span>
                </label>
                <input
                  type="number"
                  name="baseStock"
                  value={formData.baseStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Optional extra size variants (e.g. 500g, 1kg) */}
            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900 select-none">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Add extra size/weight variants (optional)
                <span className="text-xs text-neutral-400 font-normal">e.g. 500g, 1kg — each with their own price</span>
              </summary>
              <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
                {/* Add variant form */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Label</label>
                    <input type="text" placeholder="e.g. 1kg"
                      value={variationForm.title}
                      onChange={e => setVariationForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Price (₹)</label>
                    <input type="number" placeholder="0.00"
                      value={variationForm.price}
                      onChange={e => setVariationForm(p => ({ ...p, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Sale Price (₹)</label>
                    <input type="number" placeholder="0.00"
                      value={variationForm.discPrice}
                      onChange={e => setVariationForm(p => ({ ...p, discPrice: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Stock</label>
                    <input type="number" placeholder="0"
                      value={variationForm.stock}
                      onChange={e => setVariationForm(p => ({ ...p, stock: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" min="0"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <button type="button" onClick={addVariation}
                      className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Variant
                    </button>
                  </div>
                </div>

                {/* Extra variants table */}
                {variations.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 text-xs font-semibold text-neutral-600 uppercase">
                          <th className="px-4 py-2 text-left border border-neutral-200">Label</th>
                          <th className="px-4 py-2 text-left border border-neutral-200">Price</th>
                          <th className="px-4 py-2 text-left border border-neutral-200">Sale Price</th>
                          <th className="px-4 py-2 text-left border border-neutral-200">Stock</th>
                          <th className="px-4 py-2 text-left border border-neutral-200">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variations.map((v, i) => (
                          <tr key={i} className="border-b border-neutral-100">
                            <td className="px-4 py-2 font-medium text-neutral-800">{v.title}</td>
                            <td className="px-4 py-2">₹{v.price.toFixed(2)}</td>
                            <td className="px-4 py-2 text-green-600">
                              {v.discPrice > 0 ? `₹${v.discPrice.toFixed(2)}` : <span className="text-neutral-400">—</span>}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {v.stock}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <button type="button" onClick={() => removeVariation(i)}
                                className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
                              >Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </details>
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
    </div>
  );
}
