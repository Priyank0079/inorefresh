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
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectedDate, setSelectedDate] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const fetchStocks = async () => {
        setLoading(true);
        setError('');
        try {
            const params: InwardStockParams = {
                page: currentPage,
                limit: rowsPerPage,
                search: searchTerm,
                status: statusFilter !== 'All Status' ? statusFilter : undefined,
                dateFrom: selectedDate || undefined,
                dateTo: selectedDate || undefined,
            };
            const response = await getInwardStocks(params);
            if (response.success) {
                setStocks(response.data);
                if (response.pagination) {
                    setTotalPages(response.pagination.pages);
                    setTotalRecords(response.pagination.total);
                } else {
                    setTotalRecords(response.data.length);
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
                setStocks(prev => prev.map(s => s._id === id ? { ...s, status: newStatus as any } : s));
            }
        } catch (err: any) {
            console.error(err.message || 'Failed to update status');
        }
    };

    const handleConfirmDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            const res = await deleteInwardStock(confirmDeleteId);
            if (res.success) {
                setStocks(prev => prev.filter(s => s._id !== confirmDeleteId));
                setTotalRecords(prev => prev - 1);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete record');
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'Received': return 'bg-green-100 text-green-700';
            case 'Cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + stocks.length, totalRecords);

    return (
        <div className="flex flex-col h-full">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-neutral-800">Inward Stock</h1>
                <div className="text-sm text-blue-500">
                    <Link to="/warehouse" className="cursor-pointer hover:underline">Home</Link>{' '}
                    <span className="text-neutral-400">/</span>{' '}
                    <span className="text-neutral-600">Inward Stock</span>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex-1 flex flex-col">
                <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                    <span className="font-medium text-neutral-700">View Inward Stock</span>
                    <Link
                        to="/warehouse/inward-stock/add"
                        className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Inward Stock
                    </Link>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-neutral-100 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Show rows */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-600">Show</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-white border border-neutral-300 rounded py-1.5 px-2 text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        {/* Status filter */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-neutral-600">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className="bg-white border border-neutral-300 rounded py-1.5 px-3 text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                            >
                                <option>All Status</option>
                                <option>Pending</option>
                                <option>Received</option>
                                <option>Cancelled</option>
                            </select>
                        </div>
                        {/* Date filter */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-neutral-600">Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                                className="bg-white border border-neutral-300 rounded py-1.5 px-3 text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none"
                            />
                            <button
                                onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setCurrentPage(1); }}
                                className="px-3 py-1.5 bg-teal-600 text-white rounded text-xs font-bold hover:bg-teal-700 transition-colors"
                            >
                                Today
                            </button>
                            {selectedDate && (
                                <button onClick={() => setSelectedDate('')} className="text-xs text-red-500 hover:underline">
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="pl-8 pr-3 py-1.5 bg-neutral-100 border border-neutral-200 rounded text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none w-48"
                        />
                    </div>
                </div>

                {/* Error */}
                {error && !loading && (
                    <div className="p-4 text-center text-red-600 text-sm">
                        {error}
                        <button onClick={fetchStocks} className="ml-3 px-3 py-1 bg-teal-600 text-white rounded text-xs hover:bg-teal-700">
                            Retry
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse border border-neutral-200">
                        <thead>
                            <tr className="bg-neutral-50 text-xs font-bold text-neutral-800">
                                <th className="p-3 border border-neutral-200 whitespace-nowrap">Entry Date</th>
                                <th className="p-3 border border-neutral-200 whitespace-nowrap">Invoice #</th>
                                <th className="p-3 border border-neutral-200 whitespace-nowrap">Order Date</th>
                                <th className="p-3 border border-neutral-200 whitespace-nowrap">Delivery Date</th>
                                <th className="p-3 border border-neutral-200">Supplier</th>
                                <th className="p-3 border border-neutral-200">Product / Variant</th>
                                <th className="p-3 border border-neutral-200 text-center">Qty</th>
                                <th className="p-3 border border-neutral-200 text-center">Status</th>
                                <th className="p-3 border border-neutral-200 text-center min-w-[100px]">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-neutral-100">
                                        {[...Array(9)].map((_, j) => (
                                            <td key={j} className="p-3 border border-neutral-200">
                                                <div className="h-4 bg-neutral-200 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : stocks.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-10 text-center text-neutral-400 border border-neutral-200">
                                        No inward stock records found.
                                    </td>
                                </tr>
                            ) : (
                                stocks.map((stock) => (
                                    <tr key={stock._id} className="hover:bg-neutral-50 transition-colors text-sm text-neutral-700">
                                        <td className="p-3 border border-neutral-200 whitespace-nowrap text-neutral-500 text-xs">
                                            {new Date(stock.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 border border-neutral-200 font-medium text-teal-600 text-xs">
                                            {stock.invoiceNumber || 'N/A'}
                                        </td>
                                        <td className="p-3 border border-neutral-200 whitespace-nowrap text-xs">
                                            {stock.orderDate ? new Date(stock.orderDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-3 border border-neutral-200 whitespace-nowrap text-xs font-medium text-teal-700">
                                            {stock.deliveryDate ? new Date(stock.deliveryDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-3 border border-neutral-200">
                                            <div className="font-medium truncate max-w-[160px]" title={stock.supplierName}>
                                                {stock.supplierName}
                                            </div>
                                            {stock.sourcePort && (
                                                <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                                    {stock.sourcePort}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 border border-neutral-200">
                                            <div className="font-medium truncate max-w-[160px]" title={stock.productName}>
                                                {stock.productName}
                                            </div>
                                            {stock.variant && (
                                                <div className="text-[10px] text-neutral-500">{stock.variant}</div>
                                            )}
                                        </td>
                                        <td className="p-3 border border-neutral-200 text-center font-bold">
                                            {stock.quantity}
                                        </td>
                                        <td className="p-3 border border-neutral-200 text-center">
                                            <select
                                                value={stock.status}
                                                onChange={(e) => handleStatusUpdate(stock._id, e.target.value)}
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border-none outline-none cursor-pointer ${statusBadge(stock.status)}`}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Received">Received</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="p-3 border border-neutral-200">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => navigate(`/warehouse/inward-stock/edit/${stock._id}`, { state: { stock } })}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(stock._id)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                    </svg>
                                                    <span className="text-xs font-semibold">Delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {!loading && !error && (
                    <div className="px-4 py-3 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs sm:text-sm text-neutral-700">
                            {totalRecords > 0
                                ? `Showing ${startIndex + 1} to ${endIndex} of ${totalRecords} entries`
                                : 'No records'}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`min-w-[36px] h-[36px] flex items-center justify-center border rounded transition-colors ${currentPage === 1 ? 'text-neutral-300 border-neutral-200 cursor-not-allowed' : 'border-teal-600 text-teal-600 hover:bg-teal-50'}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                                if (page > totalPages) return null;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`min-w-[36px] h-[36px] flex items-center justify-center border rounded text-sm font-medium transition-colors ${currentPage === page ? 'bg-teal-600 border-teal-600 text-white' : 'border-teal-600 text-teal-600 hover:bg-teal-50'}`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`min-w-[36px] h-[36px] flex items-center justify-center border rounded transition-colors ${currentPage === totalPages ? 'text-neutral-300 border-neutral-200 cursor-not-allowed' : 'border-teal-600 text-teal-600 hover:bg-teal-50'}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                                    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900 mb-2">Delete Record?</h3>
                            <p className="text-neutral-600 text-sm mb-6">This will permanently delete this inward stock record.</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-5 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
