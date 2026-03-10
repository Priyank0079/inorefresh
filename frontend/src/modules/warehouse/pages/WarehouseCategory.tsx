import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category } from '../../../services/api/categoryService';
import { getHeaderCategoriesPublic, HeaderCategory } from '../../../services/api/headerCategoryService';
import { uploadImage } from '../../../services/api/uploadService';
import { validateImageFile, createImagePreview } from '../../../utils/imageUpload';
import api from '../../../services/api/config';

interface Product {
    _id: string;
    productName: string;
    price: number;
    stock: number;
    mainImage?: string;
    publish: boolean;
    status: string;
}

// ─── Add Category Modal (Keep it code-wise but it will be hidden from UI) ───
interface AddCategoryModalProps {
    onClose: () => void;
    onSuccess: (newCategory: Category) => void;
}

function AddCategoryModal({ onClose, onSuccess }: AddCategoryModalProps) {
    const [name, setName] = useState('');
    const [headerCategoryId, setHeaderCategoryId] = useState('');
    const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        getHeaderCategoriesPublic()
            .then(data => setHeaderCategories(data.filter(h => h.status === 'Published')))
            .catch(() => setHeaderCategories([]));
    }, []);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const v = validateImageFile(file);
        if (!v.valid) { setError(v.error || 'Invalid image'); return; }
        setImageFile(file);
        setError('');
        try { setImagePreview(await createImagePreview(file)); } catch { setError('Failed to preview image'); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) { setError('Category name is required'); return; }
        if (!headerCategoryId) { setError('Please select a header category'); return; }

        setSaving(true);
        try {
            let imageUrl = '';
            if (imageFile) {
                const result = await uploadImage(imageFile, 'zetomart/categories');
                imageUrl = result.secureUrl;
            }

            const response = await api.post('/categories', {
                name: name.trim(),
                headerCategoryId,
                image: imageUrl || undefined,
            });

            if (response.data.success) {
                onSuccess(response.data.data);
            } else {
                setError(response.data.message || 'Failed to create category');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to create category');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-teal-700 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold">Add New Category</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                            </svg>
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Category Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Fresh Fish, Masala, Prawns..."
                            className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Header Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={headerCategoryId}
                            onChange={e => setHeaderCategoryId(e.target.value)}
                            className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                        >
                            <option value="">Select a header category...</option>
                            {headerCategories.map(hc => (
                                <option key={hc._id} value={hc._id}>{hc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Category Image
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-neutral-100 rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl">📦</span>
                                )}
                            </div>
                            <div>
                                <label className="cursor-pointer inline-flex items-center gap-2 bg-teal-50 border border-teal-300 text-teal-700 hover:bg-teal-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A1.5 1.5 0 004.5 20.25h15a1.5 1.5 0 001.5-1.5V16.5m-12-9l3-3m0 0l3 3m-3-3v12.25" />
                                    </svg>
                                    Upload Image
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-xl text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${saving ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'}`}
                        >
                            {saving ? 'Creating...' : 'Create Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function WarehouseCategory() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState('');

    const fetchCategories = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/categories', { params: { status: 'Active' } });
            if (response.data.success && response.data.data) {
                // User strictly needs only 3 fish categories
                const filtered = (response.data.data || []).filter((cat: any) => {
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
                    const n = (cat.name || "").toLowerCase();
                    if (n.includes("aqua") || n.includes("freshwater") || n.includes("river")) {
                        return { ...cat, name: "Aqua Fish" };
                    }
                    if (n.includes("marine") || n.includes("marin") || n.includes("ocean") || n.includes("sea")) {
                        return { ...cat, name: "Marine Fish" };
                    }
                    if (n.includes("bangali") || n.includes("bengali") || n.includes("bengoli") || n.includes("traditional")) {
                        return { ...cat, name: "Bengali Fish" };
                    }
                    return cat;
                });
                setCategories(filtered);
            } else {
                setError(response.data.message || 'Failed to fetch categories');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const fetchProductsForCategory = async (category: Category) => {
        setSelectedCategory(category);
        setProductsLoading(true);
        setProductsError('');
        setProducts([]);
        try {
            let response;
            try {
                response = await api.get(`/warehouse/products`, {
                    params: { category: category._id, limit: 50 }
                });
            } catch (err: any) {
                if (err?.response?.status === 404) {
                    response = await api.get(`/products`, {
                        params: { category: category._id, limit: 50 }
                    });
                } else { throw err; }
            }
            if (response.data.success) {
                setProducts(response.data.data || []);
            } else {
                setProductsError(response.data.message || 'Failed to fetch products');
            }
        } catch (err: any) {
            setProductsError(err.response?.data?.message || 'Failed to fetch products');
        } finally {
            setProductsLoading(false);
        }
    };

    const handleCategoryAdded = (newCategory: Category) => {
        setShowAddModal(false);
        fetchCategories(); // Refresh with filters
        setSuccessMsg(`✅ Category created successfully!`);
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!selectedCategory) {
        return (
            <div className="flex flex-col h-full">
                {showAddModal && (
                    <AddCategoryModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={handleCategoryAdded}
                    />
                )}

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-neutral-800">Categories</h1>
                        <p className="text-sm text-neutral-500 mt-0.5">Manage your fish categories</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-blue-500">
                            <span className="cursor-pointer hover:underline" onClick={() => navigate('/warehouse')}>Home</span>
                            {' '}<span className="text-neutral-400">/</span>{' '}
                            <span className="text-neutral-600">Category</span>
                        </div>
                    </div>
                </div>

                {successMsg && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-300 text-green-700 rounded-lg text-sm animate-fadeIn">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {successMsg}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-4">
                    <div className="relative max-w-sm">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search among the 3 fish types..."
                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center justify-center p-12 bg-white rounded-lg shadow-sm border border-neutral-200">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-neutral-500 text-sm">Loading categories...</p>
                        </div>
                    </div>
                )}
                {error && !loading && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
                )}

                {!loading && !error && (
                    <>
                        <p className="text-sm text-neutral-500 mb-3">
                            {filteredCategories.length} fish categories available — <span className="text-teal-600 font-medium">click to manage products</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredCategories.map((category) => (
                                <button
                                    key={category._id}
                                    onClick={() => fetchProductsForCategory(category)}
                                    className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-4 flex flex-col items-center gap-3 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer text-left"
                                >
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center border border-neutral-200 group-hover:border-teal-300 transition-colors">
                                        {category.image ? (
                                            <img
                                                src={category.image}
                                                alt={category.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64?text=📦'; }}
                                            />
                                        ) : (
                                            <span className="text-2xl">📦</span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-neutral-700 text-center group-hover:text-teal-700 transition-colors line-clamp-2">
                                        {category.name}
                                    </span>
                                </button>
                            ))}

                            {filteredCategories.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-16 text-neutral-400 gap-3">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607Z" />
                                    </svg>
                                    <p>No categories found matching "{searchTerm}"</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="flex items-center gap-1 text-teal-600 hover:text-teal-800 transition-colors text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        All Categories
                    </button>
                    <span className="text-neutral-400">/</span>
                    <h1 className="text-2xl font-semibold text-neutral-800">{selectedCategory.name}</h1>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-4 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
                {selectedCategory.image && (
                    <img src={selectedCategory.image} alt={selectedCategory.name} className="w-10 h-10 rounded-full object-cover border border-teal-300" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <div>
                    <p className="font-medium text-teal-800">{selectedCategory.name}</p>
                    <p className="text-xs text-teal-600">{products.length} product(s) in this category</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex-1 flex flex-col">
                <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
                    <span className="font-medium text-neutral-700">Products in {selectedCategory.name}</span>
                </div>

                {productsLoading && (
                    <div className="flex items-center justify-center p-12">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-neutral-500 text-sm">Loading products...</p>
                        </div>
                    </div>
                )}
                {productsError && !productsLoading && (
                    <div className="p-4 m-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{productsError}</div>
                )}
                {!productsLoading && !productsError && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50 text-xs font-bold text-neutral-700 uppercase tracking-wide">
                                    <th className="p-4 border-b border-neutral-200">Product</th>
                                    <th className="p-4 border-b border-neutral-200">Price</th>
                                    <th className="p-4 border-b border-neutral-200">Stock</th>
                                    <th className="p-4 border-b border-neutral-200">Status</th>
                                    <th className="p-4 border-b border-neutral-200">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product._id} className="hover:bg-neutral-50 transition-colors text-sm text-neutral-700 border-b border-neutral-100">
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center border border-neutral-200 overflow-hidden flex-shrink-0">
                                                {product.mainImage ? (
                                                    <img src={product.mainImage} alt={product.productName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=📦'; }} />
                                                ) : <span className="text-lg">📦</span>}
                                            </div>
                                            <span className="font-medium text-neutral-800">{product.productName}</span>
                                        </td>
                                        <td className="p-4 font-semibold text-neutral-800">₹{product.price?.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.publish ? 'bg-teal-100 text-teal-700' : 'bg-neutral-100 text-neutral-600'}`}>
                                                {product.publish ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => navigate(`/warehouse/product/edit/${product._id}`)}
                                                className="text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-neutral-400">
                                            No products found in this category.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
