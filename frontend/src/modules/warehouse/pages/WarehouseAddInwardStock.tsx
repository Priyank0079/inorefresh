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
                            warehouseName: stock.warehouseName || user?.warehouseName || user?.name || 'Warehouse',
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
                alert(id ? "Record updated successfully" : "Inward stock added successfully");
                navigate('/warehouse/inward-stock/list');
            } else {
                // If there are validation errors, show them
                const errorMsg = res.message || "Something went wrong";
                alert(`Error: ${errorMsg}`);
            }
        } catch (err: any) {
            const apiError = err.response?.data?.message || err.message || "Failed to save record";
            alert(`Submission Error: ${apiError}`);
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
                        {/* Table-like Header */}
                        <div className="bg-slate-50 border-b border-neutral-200 px-8 py-4 grid grid-cols-7 gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <div>Requirement ID</div>
                            <div>Req. Date</div>
                            <div className="col-span-2">Warehouse</div>
                            <div>Fish Details</div>
                            <div>Quantity</div>
                            <div>Deadline</div>
                        </div>

                        {/* Form Inputs styled as a row */}
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-start">
                                {/* Requirement ID */}
                                <div className="space-y-1">
                                    <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase">Req ID</label>
                                    <div className="w-full px-3 py-2 text-sm border border-neutral-100 rounded-md bg-neutral-50 text-neutral-400 font-bold italic">
                                        {id ? formData.requirementId : "AUTO-GEN"}
                                    </div>
                                </div>

                                {/* Req Date */}
                                <div className="space-y-1">
                                    <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase">Req Date</label>
                                    <input 
                                        type="date"
                                        required
                                        value={formData.requirementDate}
                                        onChange={(e) => setFormData({...formData, requirementDate: e.target.value})}
                                        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:border-teal-500 outline-none transition-all text-slate-600"
                                    />
                                </div>

                                {/* Warehouse */}
                                <div className="col-span-2 space-y-1">
                                    <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase">Warehouse</label>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            value={formData.warehouseName}
                                            onChange={(e) => setFormData({...formData, warehouseName: e.target.value})}
                                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:border-teal-500 outline-none transition-all font-bold text-slate-800"
                                            placeholder="Warehouse Name"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5 ml-1">
                                            {user?.address || user?.location?.address || (user?.city && user?.state ? `${user.city}, ${user.state}` : 'GUJARAT, INDIA')}
                                        </p>
                                    </div>
                                </div>

                                {/* Fish Details */}
                                <div className="space-y-1">
                                    <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase">Fish Details</label>
                                    <input 
                                        type="text"
                                        list="product-list"
                                        required
                                        value={formData.fishName}
                                        onChange={(e) => setFormData({...formData, fishName: e.target.value})}
                                        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:border-teal-500 outline-none transition-all font-bold text-slate-800"
                                        placeholder="Fish Name"
                                    />
                                    <div className="flex gap-1 mt-1">
                                        <select 
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="px-2 py-1 text-[10px] border border-neutral-100 rounded bg-slate-50 text-slate-500 outline-none flex-1"
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
                                            className="px-2 py-1 text-[10px] border border-neutral-100 rounded bg-slate-50 text-slate-500 outline-none flex-1"
                                            placeholder="Grade A"
                                        />
                                    </div>
                                    <datalist id="product-list">
                                        {products.map(p => <option key={p._id} value={p.productName} />)}
                                    </datalist>
                                </div>

                                {/* Quantity */}
                                <div className="space-y-1">
                                    <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase">Quantity</label>
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:border-teal-500 outline-none transition-all font-bold text-slate-800 text-right"
                                        />
                                        <span className="text-[10px] font-bold text-slate-400">KG</span>
                                    </div>
                                </div>

                                {/* Deadline */}
                                <div className="space-y-1">
                                    <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase">Deadline</label>
                                    <input 
                                        type="date"
                                        required
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                                        className="w-full px-2 py-2 text-[11px] border border-neutral-200 rounded-md focus:border-teal-500 outline-none transition-all text-slate-500"
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
                    </form>
                </div>
            </div>
        </div>
    );
}

