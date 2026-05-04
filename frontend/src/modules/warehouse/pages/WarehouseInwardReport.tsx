import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getInwardStocks, InwardStock, InwardStockParams } from '../../../services/api/inwardStockService';
import { useAuth } from '../../../context/AuthContext';

export default function WarehouseInwardReport() {
    const { user } = useAuth();
    const [stocks, setStocks] = useState<InwardStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 0
    });

    const [summary, setSummary] = useState({
        totalQuantity: 0,
        totalShipments: 0
    });


    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            const params: InwardStockParams = {
                page: currentPage,
                limit: rowsPerPage,
                search: searchTerm,
                dateFrom: fromDate || undefined,
                dateTo: toDate || undefined,
            };

            const response = await getInwardStocks(params);

            if (response.success) {
                setStocks(response.data);
                if (response.pagination) {
                    setPagination({
                        total: response.pagination.total,
                        pages: response.pagination.pages
                    });
                }
                
                // Calculate summary for the current view (or ideally from a summary endpoint)
                const totalQty = response.data.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
                setSummary({
                    totalQuantity: totalQty,
                    totalShipments: response.pagination?.total || response.data.length
                });
            } else {
                setError(response.message || 'Failed to fetch inward reports');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error loading inward reports');
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, searchTerm, currentPage, rowsPerPage]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchReports();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [fetchReports]);

    const handleClearDates = () => {
        setFromDate('');
        setToDate('');
    };

    const handleExport = () => {
        const headers = ['Entry Date', 'Invoice #', 'Order Date', 'Delivery Date', 'Warehouse', 'Supplier', 'Product', 'Variant', 'Qty', 'Status'];
        const csvContent = [
            headers.join(','),
            ...stocks.map(stock => [
                new Date(stock.date).toLocaleDateString(),
                `"${stock.invoiceNumber || 'N/A'}"`,
                stock.orderDate ? new Date(stock.orderDate).toLocaleDateString() : '-',
                stock.deliveryDate ? new Date(stock.deliveryDate).toLocaleDateString() : '-',
                `"${user?.name || 'Warehouse'}"`,
                `"${stock.supplierName}"`,
                `"${stock.productName}"`,
                `"${stock.variant}"`,
                stock.quantity,
                stock.status
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `inward_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-neutral-50">
            {/* Header */}
            <div className="bg-[#12b2a2] text-white border-b border-teal-700 px-4 sm:px-6 py-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold font-display">Inward Report</h1>
                    <div className="flex items-center gap-2 text-sm">
                        <Link to="/Warehouse" className="text-teal-50 hover:text-white font-medium transition-colors">Home</Link>
                        <span className="text-teal-200">/</span>
                        <span className="text-white font-medium">Reports</span>
                        <span className="text-teal-200">/</span>
                        <span className="text-white font-medium">Inward</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 sm:p-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Shipments</p>
                            <p className="text-2xl font-bold text-neutral-800">{summary.totalShipments}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2V15H6L11 19V5Z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Quantity</p>
                            <p className="text-2xl font-bold text-neutral-800">{summary.totalQuantity.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
                    <div className="bg-[#12b2a2] text-white px-6 py-4 flex justify-between items-center">
                        <h2 className="text-lg font-bold">Inward Stock Details</h2>
                        <button 
                            onClick={handleExport}
                            className="bg-white text-[#12b2a2] hover:bg-teal-50 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                            Export CSV
                        </button>
                    </div>

                    {/* Filter Bar */}
                    <div className="p-6 border-b border-neutral-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-neutral-400 uppercase">From Date</label>
                                <input 
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#12b2a2]"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-neutral-400 uppercase">To Date</label>
                                <input 
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#12b2a2]"
                                />
                            </div>
                            <button 
                                onClick={handleClearDates}
                                className="mt-5 px-4 py-2 text-sm font-bold text-neutral-600 hover:text-red-500 transition-colors"
                            >
                                Reset
                            </button>
                        </div>

                        <div className="flex items-center gap-4 w-full lg:w-auto">
                            <div className="flex-1 lg:w-64 relative">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                                    <circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path>
                                </svg>
                                <input 
                                    type="text"
                                    placeholder="Search supplier, product..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#12b2a2]"
                                />
                            </div>
                            <select 
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#12b2a2]"
                            >
                                <option value={10}>10 Rows</option>
                                <option value={25}>25 Rows</option>
                                <option value={50}>50 Rows</option>
                            </select>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto min-h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center p-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center text-red-500">{error}</div>
                        ) : (
                            <table className="w-full text-left border-collapse border border-neutral-200">
                                <thead>
                                    <tr className="bg-neutral-50 text-xs font-bold text-neutral-800">
                                        <th className="p-4 border border-neutral-200">
                                            <div className="flex items-center gap-1">Inward Id / Invoice #</div>
                                        </th>
                                        <th className="p-4 border border-neutral-200">
                                            <div className="flex items-center gap-1">Warehouse Name</div>
                                        </th>
                                        <th className="p-4 border border-neutral-200">
                                            <div className="flex items-center gap-1">Supplier</div>
                                        </th>
                                        <th className="p-4 border border-neutral-200">
                                            <div className="flex items-center gap-1">Product</div>
                                        </th>
                                        <th className="p-4 border border-neutral-200">
                                            <div className="flex items-center gap-1">Variant</div>
                                        </th>
                                        <th className="p-4 border border-neutral-200 text-center">
                                            <div className="flex items-center justify-center gap-1">Quantity</div>
                                        </th>

                                        <th className="p-4 border border-neutral-200">
                                            <div className="flex items-center gap-1">Entry Date</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stocks.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-neutral-500">
                                                No data available in table
                                            </td>
                                        </tr>
                                    ) : (
                                        stocks.map((stock, index) => (
                                            <tr key={index} className="hover:bg-neutral-50">
                                                <td className="p-4 border border-neutral-200 text-sm">
                                                    <span className="text-teal-600 font-medium">
                                                        {stock.invoiceNumber || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{user?.name || 'Warehouse'}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{stock.supplierName}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{stock.productName}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{stock.variant}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900 text-center font-bold">{stock.quantity}</td>

                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{new Date(stock.date).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-neutral-500">
                            Showing <span className="font-bold text-neutral-800">{stocks.length}</span> of <span className="font-bold text-neutral-800">{pagination.total}</span> records
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-4 py-2 border border-neutral-200 rounded-lg text-sm font-bold hover:bg-white disabled:opacity-50 transition-all"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => (
                                    <button 
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                                            currentPage === i + 1 ? 'bg-[#12b2a2] text-white' : 'hover:bg-neutral-200 text-neutral-600'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button 
                                disabled={currentPage === pagination.pages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-4 py-2 border border-neutral-200 rounded-lg text-sm font-bold hover:bg-white disabled:opacity-50 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="p-8 text-center">
                <p className="text-xs text-neutral-400">© 2025 Inor Fresh - Inward Inventory Audit Report</p>
            </footer>
        </div>
    );
}
