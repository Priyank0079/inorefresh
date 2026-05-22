import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { addInwardStock, updateInwardStock, getInwardStockById, InwardStock } from '@/services/api/inwardStockService';
import { getProducts, Product } from '@/services/api/productService';
import { useAuth } from '@/context/AuthContext';


export default function WarehouseAddInwardStock() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const editingStock = location.state?.stock as InwardStock;
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    
    const [formData, setFormData] = useState({
        requirementId: 'AUTO-GEN', // Placeholder for auto-generated ID
        requirementDate: new Date().toISOString().split('T')[0],
        warehouseName: user?.warehouseName || user?.name || 'Loading Warehouse...',
        fishName: '',
        category: 'Fresh',
        variantGrade: '',
        quantity: 0,
        deadline: '',
        status: 'Open'
    });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await getProducts({ limit: 100 });
                if (res.success) {
                    setProducts(res.data);
                }
            } catch (err) {
                console.error("Error fetching products:", err);
            }
        };

        const fetchStockDetail = async () => {
            if (id && !editingStock) {
                setLoading(true);
                try {
                    const res = await getInwardStockById(id);
                    if (res.success) {
                        const stock = res.data;
                        setFormData({
                            requirementId: stock.invoiceNumber || 'AUTO-GEN',
                            requirementDate: new Date(stock.date).toISOString().split('T')[0],
                            warehouseName: (stock as any).warehouseName || user?.warehouseName || user?.name || 'Warehouse',
                            fishName: stock.productName,
                            category: (stock as any).category || 'Fresh',
                            variantGrade: stock.variant,
                            quantity: stock.quantity,
                            deadline: stock.deliveryDate ? new Date(stock.deliveryDate).toISOString().split('T')[0] : '',
                            status: stock.status === 'Received' ? 'Closed' : 'Open'
                        });
                    }
                } catch (err) {
                    console.error("Error fetching stock detail:", err);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchProducts();
        fetchStockDetail();
    }, [id, editingStock, user]);

    // Sync warehouse name when user is loaded
    useEffect(() => {
        if (user && !id) {
            setFormData(prev => ({
                ...prev,
                warehouseName: user.warehouseName || user.name || prev.warehouseName
            }));
        }
    }, [user, id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSubmit = {
                supplierName: "Port Partner",
                productName: formData.fishName,
                category: formData.category,
                variant: formData.variantGrade,
                quantity: formData.quantity,
                date: new Date(formData.requirementDate),
                deliveryDate: formData.deadline ? new Date(formData.deadline) : undefined,
                status: formData.status === 'Open' ? 'Pending' : 'Received',
                remarks: formData.requirementId
            };

            const res = id 
                ? await updateInwardStock(id, dataToSubmit as any)
                : await addInwardStock(dataToSubmit as any);
                
            if (res.success) {
                setSubmitMessage({ text: id ? "Record updated successfully" : "Inward stock added successfully", type: 'success' });
                setTimeout(() => navigate('/warehouse/inward-stock/list'), 1500);
            } else {
                // If there are validation errors, show them
                const errorMsg = res.message || "Something went wrong";
                setSubmitMessage({ text: `Error: ${errorMsg}`, type: 'error' });
            }
        } catch (err: any) {
            const apiError = err.response?.data?.message || err.message || "Failed to save record";
            setSubmitMessage({ text: `Submission Error: ${apiError}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50 min-h-screen">
            {/* Page Header */}
            <div className="bg-[#12b2a2] text-white p-6 rounded-lg shadow-sm mb-6 flex justify-between items-center transition-all mx-4 mt-4">
                <div>
                    <h1 className="text-2xl font-bold">{id ? 'Edit' : 'Add New'} Requirement</h1>
                    <p className="text-teal-50 text-sm mt-1">Create a new fish requirement for ports</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Link to="/warehouse" className="text-teal-50 hover:text-white font-medium transition-colors">Home</Link>
                    <span className="text-teal-200">/</span>
                    <Link to="/warehouse/inward-stock/list" className="text-teal-50 hover:text-white font-medium transition-colors">Requirements</Link>
                    <span className="text-teal-200">/</span>
                    <span className="text-white font-medium">{id ? 'Edit' : 'Add'}</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto w-full px-4 mb-8">
                <div className="bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-0">
                        {/* Table-like Header — hidden on mobile, visible md+ */}
                        <div className="hidden md:grid bg-slate-50 border-b border-neutral-200 px-8 py-4 grid-cols-4 lg:grid-cols-7 gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <div>Requirement ID</div>
                            <div>Req. Date</div>
                            <div className="lg:col-span-2">Warehouse</div>
                            <div>Fish Details</div>
                            <div>Qty (KG)</div>
                            <div>Deadline</div>
                        </div>

                        {/* Form Inputs — Bug #135-139: responsive grid with min-w-0 to prevent overflow */}
                        <div className="p-6 sm:p-8 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-start">
                                {/* Requirement ID */}
                                <div className="space-y-1 min-w-0">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Req ID</label>
                                    <div className="w-full px-3 py-2 text-sm border border-neutral-100 rounded-md bg-neutral-50 text-neutral-400 font-bold italic truncate">
                                        {id ? formData.requirementId : "AUTO-GEN"}
                                    </div>
                                </div>

                                {/* Req Date */}
                                <div className="space-y-1 min-w-0">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Req. Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.requirementDate}
                                        onChange={(e) => setFormData({...formData, requirementDate: e.target.value})}
                                        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:border-teal-500 outline-none transition-all text-slate-600"
                                    />
                                </div>

                                {/* Warehouse — col-span-2 on lg only */}
                                <div className="sm:col-span-2 md:col-span-2 lg:col-span-2 space-y-1 min-w-0">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Warehouse</label>
                                    <input
                                        type="text"
                                        value={formData.warehouseName}
                                        onChange={(e) => setFormData({...formData, warehouseName: e.target.value})}
                                        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:border-teal-500 outline-none transition-all font-bold text-slate-800"
                                        placeholder="Warehouse Name"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-0.5 ml-1 truncate">
                                        {user?.address || user?.location?.address || (user?.city && (user as any)?.state ? `${user.city}, ${(user as any).state}` : 'GUJARAT, INDIA')}
                                    </p>
                                </div>

                                {/* Fish Details */}
                                <div className="space-y-2 min-w-0">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fish Details</label>
                                    <input
                                        type="text"
                                        list="product-list"
                                        required
                                        value={formData.fishName}
                                        onChange={(e) => setFormData({...formData, fishName: e.target.value})}
                                        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:border-teal-500 outline-none transition-all font-bold text-slate-800"
                                        placeholder="Fish Name"
                                    />
                                    <div className="grid grid-cols-2 gap-1">
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded bg-slate-50 text-slate-600 outline-none focus:border-teal-500"
                                        >
                                            <option value="Fresh">Fresh</option>
                                            <option value="Premium">Premium</option>
                                            <option value="Standard">Standard</option>
                                            <option value="Crustaceans">Crustaceans</option>
                                        </select>
                                        <input
                                            type="text"
                                            required
                                            value={formData.variantGrade}
                                            onChange={(e) => setFormData({...formData, variantGrade: e.target.value})}
                                            className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded bg-slate-50 text-slate-600 outline-none focus:border-teal-500"
                                            placeholder="Grade A"
                                        />
                                    </div>
                                    <datalist id="product-list">
                                        {products.map(p => <option key={p._id} value={p.productName} />)}
                                    </datalist>
                                </div>

                                {/* Quantity */}
                                <div className="space-y-1 min-w-0">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Qty (KG)</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                                            className="w-full min-w-0 px-3 py-2 text-sm border border-neutral-200 rounded-md focus:border-teal-500 outline-none transition-all font-bold text-slate-800 text-right"
                                        />
                                        <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">KG</span>
                                    </div>
                                </div>

                                {/* Deadline */}
                                <div className="space-y-1 min-w-0">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Deadline</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                                        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:border-teal-500 outline-none transition-all text-slate-600"
                                    />
                                </div>
                            </div>

                            {/* Status and Action */}
                            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                                    <div className="flex gap-2">
                                        {['Open', 'Closed'].map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setFormData({...formData, status: s})}
                                                className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                                                    formData.status === s 
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                    {submitMessage && (
                                        <div className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-center ${
                                            submitMessage.type === 'success'
                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                            {submitMessage.text}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/warehouse/inward-stock/list')}
                                            className="px-8 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-slate-600 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-[#12b2a2] hover:bg-[#0f9689] text-white px-12 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-500/20 disabled:opacity-50"
                                        >
                                            {loading ? "Processing..." : id ? "Update Requirement" : "Save Requirement"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

