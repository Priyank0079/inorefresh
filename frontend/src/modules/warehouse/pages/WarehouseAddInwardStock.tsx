import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { addInwardStock, updateInwardStock, getInwardStockById, InwardStock } from '../../../services/api/inwardStockService';
import { getProducts, Product } from '../../../services/api/productService';

export default function WarehouseAddInwardStock() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const editingStock = location.state?.stock as InwardStock;

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [formData, setFormData] = useState({
        supplierName: editingStock?.supplierName || '',
        sourcePort: editingStock?.sourcePort || '',
        productName: editingStock?.productName || '',
        variant: editingStock?.variant || '',
        quantity: editingStock?.quantity || 0,
        unitPrice: editingStock?.unitPrice || 0,
        totalPrice: editingStock?.totalPrice || 0,
        date: editingStock?.date ? new Date(editingStock.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        invoiceNumber: editingStock?.invoiceNumber || '',
        batchNumber: editingStock?.batchNumber || '',
        vehicleNumber: editingStock?.vehicleNumber || '',
        status: editingStock?.status || 'Pending',
        remarks: editingStock?.remarks || ''
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
                            supplierName: stock.supplierName,
                            sourcePort: stock.sourcePort || '',
                            productName: stock.productName,
                            variant: stock.variant,
                            quantity: stock.quantity,
                            unitPrice: stock.unitPrice,
                            totalPrice: stock.totalPrice,
                            date: new Date(stock.date).toISOString().split('T')[0],
                            invoiceNumber: stock.invoiceNumber,
                            batchNumber: stock.batchNumber || '',
                            vehicleNumber: stock.vehicleNumber || '',
                            status: stock.status,
                            remarks: stock.remarks || ''
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
    }, [id, editingStock]);

    // Update total price when quantity or unit price changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            totalPrice: prev.quantity * prev.unitPrice
        }));
    }, [formData.quantity, formData.unitPrice]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = id 
                ? await updateInwardStock(id, formData)
                : await addInwardStock(formData);
            if (res.success) {
                alert(id ? "Record updated successfully" : "Inward stock added successfully");
                navigate('/warehouse/inward-stock/list');
            } else {
                alert(res.message || "Something went wrong");
            }
        } catch (err: any) {
            alert(err.message || "Failed to save record");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50 min-h-screen">
            {/* Page Header */}
            <div className="bg-[#12b2a2] text-white p-6 rounded-lg shadow-sm mb-6 flex justify-between items-center transition-all mx-4 mt-4">
                <div>
                    <h1 className="text-2xl font-bold">{id ? 'Edit' : 'Add New'} Inward Stock</h1>
                    <p className="text-teal-50 text-sm mt-1">Record stock coming into the warehouse</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Link to="/warehouse" className="text-teal-50 hover:text-white font-medium transition-colors">Home</Link>
                    <span className="text-teal-200">/</span>
                    <Link to="/warehouse/inward-stock/list" className="text-teal-50 hover:text-white font-medium transition-colors">Inward Stock</Link>
                    <span className="text-teal-200">/</span>
                    <span className="text-white font-medium">{id ? 'Edit' : 'Add'}</span>
                </div>
            </div>

            {/* Form Card */}
            <div className="mx-4 mb-8 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden">
                <div className="bg-[#12b2a2] text-white px-6 py-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                        Inward Stock Details
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Supplier Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider border-b border-teal-100 pb-1">Supplier Info</h3>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Supplier Name *</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.supplierName}
                                    onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none transition-all"
                                    placeholder="Enter supplier name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Source Port / Location</label>
                                <input 
                                    type="text"
                                    value={formData.sourcePort}
                                    onChange={(e) => setFormData({...formData, sourcePort: e.target.value})}
                                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none transition-all"
                                    placeholder="e.g. Port A, Main Hub"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Invoice Number *</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.invoiceNumber}
                                    onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none transition-all"
                                    placeholder="INV-00123"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Batch Number</label>
                                <input 
                                    type="text"
                                    value={formData.batchNumber}
                                    onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none transition-all"
                                    placeholder="e.g. BATCH-2024-001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Date *</label>
                                <input 
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider border-b border-teal-100 pb-1">Product Info</h3>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Product *</label>
                                <input 
                                    type="text"
                                    list="product-list"
                                    required
                                    value={formData.productName}
                                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none transition-all"
                                    placeholder="Select or type product"
                                />
                                <datalist id="product-list">
                                    {products.map(p => <option key={p._id} value={p.productName} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Variant *</label>
                                <input 
                                    type="text"
                                    required
                                    value={formData.variant}
                                    onChange={(e) => setFormData({...formData, variant: e.target.value})}
                                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none transition-all"
                                    placeholder="e.g. 500g, 1kg, Red"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Vehicle Number</label>
                                <input 
                                    type="text"
                                    value={formData.vehicleNumber}
                                    onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none transition-all"
                                    placeholder="GJ-01-AB-1234"
                                />
                            </div>
                        </div>

                        {/* Inventory Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider border-b border-teal-100 pb-1">Inventory & Cost</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Quantity *</label>
                                    <input 
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                                        className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Unit Price *</label>
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.unitPrice}
                                        onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})}
                                        className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Total Price</label>
                                <div className="w-full px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg text-[#12b2a2] font-bold text-lg">
                                    ₹{formData.totalPrice.toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Status</label>
                                <select 
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none transition-all"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Received">Received</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <label className="block text-sm font-semibold text-neutral-700 mb-1">Remarks / Note</label>
                        <textarea 
                            rows={3}
                            value={formData.remarks}
                            onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                            className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none transition-all resize-none"
                            placeholder="Add any additional information about this inward shipment..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 border-t border-neutral-100 pt-8">
                        <button 
                            type="button"
                            onClick={() => navigate('/warehouse/inward-stock/list')}
                            className="px-6 py-2.5 border border-neutral-300 text-neutral-700 font-bold rounded-lg hover:bg-neutral-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-10 py-2.5 bg-[#12b2a2] text-white font-bold rounded-lg hover:bg-[#0e8f82] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                            )}
                            {id ? 'Update' : 'Save'} Record
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
