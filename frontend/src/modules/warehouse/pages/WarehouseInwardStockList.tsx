import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInwardStocks, updateInwardStockStatus, deleteInwardStock, InwardStock, InwardStockParams } from '../../../services/api/inwardStockService';

export default function WarehouseInwardStockList() {
    const navigate = useNavigate();
    const [stocks, setStocks] = useState<InwardStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedDate, setSelectedDate] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [statusErrorId, setStatusErrorId] = useState<string | null>(null);

    const fetchStocks = async () => {
        setLoading(true);
        setError('');
        try {
            const params: InwardStockParams = {
                page: currentPage,
                limit: rowsPerPage,
                search: searchTerm,
                status: statusFilter !== 'All Status' ? statusFilter : undefined,
                dateFrom: selectedDate ? selectedDate : undefined,
                dateTo: selectedDate ? selectedDate : undefined,
            };

            const response = await getInwardStocks(params);
            if (response.success) {
                setStocks(response.data);
                if (response.pagination) {
                    setTotalPages(response.pagination.pages);
                }
            } else {
                setError(response.message || 'Failed to fetch inward stock');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch inward stock');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStocks();
    }, [currentPage, rowsPerPage, statusFilter, searchTerm, selectedDate]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await updateInwardStockStatus(id, newStatus);
            if (res.success) {
                setStocks(prev => prev.map(stock => stock._id === id ? { ...stock, status: newStatus as any } : stock));
            }
        } catch (err: any) {
            setStatusErrorId(id);
            setTimeout(() => setStatusErrorId(null), 3000);
            console.error(err.message || "Failed to update status");
        }
    };

    const handleDelete = (id: string) => {
        setConfirmDeleteId(id);
    };

    const handleConfirmDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            const res = await deleteInwardStock(confirmDeleteId);
            if (res.success) {
                setStocks(prev => prev.filter(stock => stock._id !== confirmDeleteId));
            }
        } catch (err: any) {
            setError(err.message || "Failed to delete record");
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Received': return 'bg-green-100 text-green-700';
            case 'Cancelled': return 'bg-red-100 text-red-700';
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50 min-h-screen">
            {/* Page Header */}
            <div className="bg-[#12b2a2] text-white p-4 rounded-lg shadow-sm mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 transition-all mx-4 mt-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold">Inward Stock</h1>
                    <p className="text-teal-50 text-xs sm:text-sm mt-0.5 hidden sm:block">Manage stock incoming from suppliers and other ports</p>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm bg-teal-800/30 px-3 py-1.5 rounded-full">
                    <Link to="/warehouse" className="text-teal-50 hover:text-white font-medium transition-colors">Home</Link>
                    <span className="text-teal-200">/</span>
                    <span className="text-white font-medium">Inward Stock</span>
                </div>
            </div>

            {/* Content Card */}
            <div className="mx-4 mb-6 bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col">
                <div className="bg-[#12b2a2] text-white px-4 py-3 rounded-t-lg flex justify-between items-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold whitespace-nowrap">View Inward Stock</h2>
                    <Link 
                        to="/warehouse/inward-stock/add"
                        className="bg-white text-[#12b2a2] hover:bg-teal-50 px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span className="hidden sm:inline">Add Inward Stock</span>
                        <span className="sm:hidden">Add Stock</span>
                    </Link>
                </div>

                {/* Filters */}
                <div className="p-3 border-b border-neutral-100 flex flex-col lg:flex-row justify-between gap-3">
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs sm:text-sm text-neutral-600 whitespace-nowrap">Status:</span>
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white border border-neutral-300 rounded px-2 py-1.5 text-xs sm:text-sm focus:ring-1 focus:ring-[#12b2a2] outline-none flex-1 sm:flex-none"
                            >
                                <option>All Status</option>
                                <option>Pending</option>
                                <option>Received</option>
                                <option>Cancelled</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs sm:text-sm text-neutral-600 font-medium whitespace-nowrap">Date:</span>
                            <input 
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-white border border-neutral-300 rounded px-2 py-1.5 text-xs sm:text-sm focus:ring-1 focus:ring-[#12b2a2] outline-none flex-1 sm:flex-none"
                            />
                            <button 
                                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                                className="px-2 py-1.5 bg-[#12b2a2] text-white rounded text-xs font-bold hover:bg-[#0e8a7d] transition-colors whitespace-nowrap"
                            >
                                Today
                            </button>
                            {selectedDate && (
                                <button 
                                    onClick={() => setSelectedDate('')}
                                    className="text-xs text-red-500 hover:underline font-medium whitespace-nowrap"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </span>
                            <input 
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-md text-xs sm:text-sm focus:ring-1 focus:ring-[#12b2a2] outline-none w-full sm:w-48"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 text-[10px] sm:text-xs font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-200">
                                <th className="px-3 py-2.5">Entry Date</th>
                                <th className="px-3 py-2.5">Invoice #</th>
                                <th className="px-3 py-2.5">Order Date</th>
                                <th className="px-3 py-2.5">Delivery Date</th>
                                <th className="px-3 py-2.5">Supplier</th>
                                <th className="px-3 py-2.5">Product / Variant</th>
                                <th className="px-3 py-2.5 text-center">Qty</th>
                                <th className="px-3 py-2.5 text-center">Status</th>

                                <th className="px-3 py-2.5 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {loading ? (
                                <tr><td colSpan={11} className="p-12 text-center text-neutral-400">Loading records...</td></tr>
                            ) : stocks.length === 0 ? (
                                <tr><td colSpan={11} className="p-12 text-center text-neutral-400">No inward stock records found.</td></tr>
                            ) : (
                                stocks.map((stock) => (
                                    <tr key={stock._id} className="hover:bg-neutral-50 transition-colors text-xs sm:text-sm">
                                        <td className="px-3 py-2 whitespace-nowrap text-neutral-500">{new Date(stock.date).toLocaleDateString()}</td>
                                        <td className="px-3 py-2 font-medium text-[#12b2a2]">{stock.invoiceNumber || 'N/A'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{stock.orderDate ? new Date(stock.orderDate).toLocaleDateString() : '-'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap font-medium text-teal-700">{stock.deliveryDate ? new Date(stock.deliveryDate).toLocaleDateString() : '-'}</td>
                                        <td className="px-3 py-2">
                                            <div className="font-medium truncate max-w-[150px] sm:max-w-[200px]" title={stock.supplierName}>{stock.supplierName}</div>
                                            {stock.sourcePort && <div className="text-[9px] sm:text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded inline-block mt-0.5">From: {stock.sourcePort}</div>}
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="font-medium truncate max-w-[150px] sm:max-w-[200px]" title={stock.productName}>{stock.productName}</div>
                                            <div className="text-[10px] sm:text-xs text-neutral-500">{stock.variant}</div>
                                        </td>
                                        <td className="px-3 py-2 text-center font-bold">{stock.quantity}</td>
                                        <td className="px-3 py-2 text-center">

                                            <select 
                                                value={stock.status}
                                                onChange={(e) => handleStatusUpdate(stock._id, e.target.value)}
                                                className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border-none outline-none cursor-pointer ${getStatusColor(stock.status)}`}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Received">Received</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button 
                                                    onClick={() => navigate(`/warehouse/inward-stock/edit/${stock._id}`, { state: { stock } })}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(stock._id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-4 bg-neutral-50 rounded-b-lg flex justify-between items-center text-sm text-neutral-600">
                    <div>Showing {stocks.length} records</div>
                    <div className="flex gap-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="px-3 py-1 bg-white border border-neutral-300 rounded disabled:opacity-50"
                        >Prev</button>
                        <span className="px-3 py-1">Page {currentPage} of {totalPages}</span>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="px-3 py-1 bg-white border border-neutral-300 rounded disabled:opacity-50"
                        >Next</button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-neutral-800 text-center mb-1">Delete Record?</h3>
                        <p className="text-sm text-neutral-500 text-center mb-6">This will permanently delete this inward stock record.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
